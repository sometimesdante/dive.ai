-- Add 'complete' as a valid task status
alter table public.tasks
  drop constraint tasks_status_check;

alter table public.tasks
  add constraint tasks_status_check
    check (status in ('default', 'overdue', 'approaching', 'on-track', 'complete'));
