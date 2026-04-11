'use client'

import { useState, useEffect, useRef } from 'react'
import { Send, Paperclip, X, FileText, Image } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { sendMessage } from '@/app/(dive)/chat/actions'

type Project = { id: string; name: string; code: string; cluster_id: string | null }
type Cluster  = { id: string; name: string }
type Message  = {
  id: string
  content: string
  created_at: string
  sender_id: string | null
  profiles: { name: string | null; email: string | null } | null
  attachment_url:  string | null
  attachment_name: string | null
  attachment_type: string | null
  attachment_size: number | null
}

type Props = {
  clusters: Cluster[]
  projects: Project[]
  currentUserId: string
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function AttachmentPreview({ url, name, type }: { url: string; name: string; type: string }) {
  const isImage = type.startsWith('image/')
  if (isImage) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="block mt-1.5 max-w-xs">
        <img src={url} alt={name} className="rounded max-h-48 object-contain border border-[#e8e8e8]" />
      </a>
    )
  }
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-1.5 flex items-center gap-2 px-3 py-2 rounded border border-[#e8e8e8] bg-[#f9f9f9] hover:bg-[#f2f2f2] transition-colors max-w-xs"
    >
      <FileText size={14} className="text-[#838383] shrink-0" />
      <span className="text-sm text-[#242424] truncate">{name}</span>
    </a>
  )
}

export default function Chat({ clusters, projects, currentUserId }: Props) {
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [messages, setMessages]                   = useState<Message[]>([])
  const [input, setInput]                         = useState('')
  const [sending, setSending]                     = useState(false)
  const [pendingFile, setPendingFile]             = useState<File | null>(null)
  const [uploading, setUploading]                 = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const selectedProject = projects.find(p => p.id === selectedProjectId)

  const clustered   = clusters.map(c => ({ ...c, projects: projects.filter(p => p.cluster_id === c.id) }))
  const unclustered = projects.filter(p => p.cluster_id === null)

  const messageSelect = 'id, content, created_at, sender_id, profiles(name, email), attachment_url, attachment_name, attachment_type, attachment_size'

  // Load messages when project changes
  useEffect(() => {
    if (!selectedProjectId) return
    setMessages([])
    supabase
      .from('messages')
      .select(messageSelect)
      .eq('project_id', selectedProjectId)
      .order('created_at', { ascending: true })
      .then(({ data }) => setMessages((data as unknown as Message[]) ?? []))
  }, [selectedProjectId])

  // Realtime subscription
  useEffect(() => {
    if (!selectedProjectId) return
    const channel = supabase
      .channel(`messages:${selectedProjectId}`)
      .on('postgres_changes', {
        event:  'INSERT',
        schema: 'public',
        table:  'messages',
        filter: `project_id=eq.${selectedProjectId}`,
      }, async (payload) => {
        const { data } = await supabase
          .from('messages')
          .select(messageSelect)
          .eq('id', payload.new.id)
          .single()
        if (data) setMessages(prev => [...prev, data as unknown as Message])
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [selectedProjectId])

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    setPendingFile(file)
    e.target.value = ''
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if ((!input.trim() && !pendingFile) || !selectedProjectId || sending) return
    setSending(true)

    let attachment: { url: string; name: string; type: string; size: number } | null = null

    if (pendingFile) {
      setUploading(true)
      const ext  = pendingFile.name.split('.').pop()
      const path = `${selectedProjectId}/${Date.now()}_${pendingFile.name}`
      const { error: uploadError } = await supabase.storage
        .from('chat-attachments')
        .upload(path, pendingFile, { contentType: pendingFile.type })
      setUploading(false)

      if (!uploadError) {
        const { data: { publicUrl } } = supabase.storage
          .from('chat-attachments')
          .getPublicUrl(path)
        attachment = { url: publicUrl, name: pendingFile.name, type: pendingFile.type, size: pendingFile.size }
      }
      setPendingFile(null)
    }

    const content = input.trim()
    setInput('')
    await sendMessage(selectedProjectId, content, attachment)

    const { data } = await supabase
      .from('messages')
      .select(messageSelect)
      .eq('project_id', selectedProjectId)
      .order('created_at', { ascending: true })
    setMessages((data as unknown as Message[]) ?? [])
    setSending(false)
  }

  return (
    <div className="flex h-full">

      {/* Channel sidebar */}
      <div className="w-56 shrink-0 border-r border-[#e8e8e8] flex flex-col bg-[#fafafa]">
        <div className="px-4 h-[60px] flex items-center border-b border-[#e8e8e8] shrink-0">
          <span className="font-semibold text-[#242424]">Channels</span>
        </div>

        <div className="flex-1 overflow-y-auto py-3">
          {clustered.map(cluster => cluster.projects.length > 0 && (
            <div key={cluster.id} className="mb-4">
              <p className="px-4 pb-1 text-[10px] font-semibold text-[#838383] uppercase tracking-widest">
                {cluster.name}
              </p>
              {cluster.projects.map(p => (
                <button
                  key={p.id}
                  onClick={() => setSelectedProjectId(p.id)}
                  className={`w-full text-left px-4 py-1.5 text-sm transition-colors cursor-pointer ${
                    selectedProjectId === p.id
                      ? 'bg-[#063530] text-white'
                      : 'text-[#242424] hover:bg-[#efefef]'
                  }`}
                >
                  # {p.name.toLowerCase()}
                </button>
              ))}
            </div>
          ))}

          {unclustered.length > 0 && (
            <div className="mb-4">
              <p className="px-4 pb-1 text-[10px] font-semibold text-[#838383] uppercase tracking-widest">
                Other
              </p>
              {unclustered.map(p => (
                <button
                  key={p.id}
                  onClick={() => setSelectedProjectId(p.id)}
                  className={`w-full text-left px-4 py-1.5 text-sm transition-colors cursor-pointer ${
                    selectedProjectId === p.id
                      ? 'bg-[#063530] text-white'
                      : 'text-[#242424] hover:bg-[#efefef]'
                  }`}
                >
                  # {p.name.toLowerCase()}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Message panel */}
      {!selectedProjectId ? (
        <div className="flex-1 flex items-center justify-center text-[#838383] text-sm">
          Select a channel to start chatting
        </div>
      ) : (
        <div className="flex-1 flex flex-col min-w-0">

          {/* Header */}
          <div className="h-[60px] shrink-0 border-b border-[#e8e8e8] px-6 flex items-center">
            <span className="font-semibold text-[#242424]"># {selectedProject?.name.toLowerCase()}</span>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-5">
            {messages.length === 0 && (
              <p className="text-[#838383] text-sm">No messages yet. Say hello!</p>
            )}
            {messages.map(msg => {
              const name     = msg.profiles?.name ?? msg.profiles?.email ?? 'Unknown'
              const initials = name[0].toUpperCase()
              const time     = new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              return (
                <div key={msg.id} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#063530] text-white text-xs flex items-center justify-center shrink-0 uppercase">
                    {initials}
                  </div>
                  <div>
                    <div className="flex items-baseline gap-2 mb-0.5">
                      <span className="font-semibold text-sm text-[#242424]">{name}</span>
                      <span className="text-xs text-[#838383]">{time}</span>
                    </div>
                    {msg.content && <p className="text-sm text-[#242424]">{msg.content}</p>}
                    {msg.attachment_url && msg.attachment_name && msg.attachment_type && (
                      <AttachmentPreview
                        url={msg.attachment_url}
                        name={msg.attachment_name}
                        type={msg.attachment_type}
                      />
                    )}
                    {msg.attachment_size && (
                      <span className="text-xs text-[#838383] mt-0.5 block">{formatBytes(msg.attachment_size)}</span>
                    )}
                  </div>
                </div>
              )
            })}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSend} className="px-6 py-4 border-t border-[#e8e8e8] shrink-0">
            {pendingFile && (
              <div className="mb-2 flex items-center gap-2 px-3 py-1.5 bg-[#f2f2f2] border border-[#e8e8e8] rounded w-fit max-w-full">
                {pendingFile.type.startsWith('image/') ? (
                  <Image size={13} className="text-[#838383] shrink-0" />
                ) : (
                  <FileText size={13} className="text-[#838383] shrink-0" />
                )}
                <span className="text-sm text-[#242424] truncate max-w-[200px]">{pendingFile.name}</span>
                <span className="text-xs text-[#838383] shrink-0">{formatBytes(pendingFile.size)}</span>
                <button
                  type="button"
                  onClick={() => setPendingFile(null)}
                  className="text-[#838383] hover:text-[#242424] transition-colors shrink-0"
                >
                  <X size={12} />
                </button>
              </div>
            )}
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-10 h-10 flex items-center justify-center text-[#838383] hover:text-[#242424] hover:bg-[#f2f2f2] rounded transition-colors shrink-0"
                title="Attach file"
              >
                <Paperclip size={16} />
              </button>
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder={`Message #${selectedProject?.name.toLowerCase()}`}
                className="flex-1 bg-[#f2f2f2] border border-[#e8e8e8] h-10 px-4 rounded text-black outline-none text-sm"
              />
              <button
                type="submit"
                disabled={sending || uploading || (!input.trim() && !pendingFile)}
                className="w-10 h-10 flex items-center justify-center bg-[#063530] text-white rounded disabled:opacity-40 cursor-pointer"
              >
                <Send size={14} />
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
