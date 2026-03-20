# download-history

Track completed downloads and show per-entry history from the file menu.

## Features

- logs completed downloads only
- stores `finishedAt`, `ip`, `username`
- per-entry history in frontend file menu
- access control with fallback:
  - if `can_view` is configured, only selected users/groups can view
  - if `can_view` is empty, only admins can view
- retention cap per entry (`max_entries_per_file`, default `100`)

## Local install

```bash
ln -s /Users/rejetto/code/hfs-plugin/download-history/dist ~/.hfs/plugins/download-history
```

## Config

- `can_view` (username, multiple): users/groups allowed to read history
- `max_entries_per_file` (number): how many newest records are kept per entry
