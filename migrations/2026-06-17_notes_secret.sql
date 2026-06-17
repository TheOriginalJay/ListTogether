-- Bagged — secret space: PIN-gated notes.
alter table notes add column if not exists is_secret boolean not null default false;
