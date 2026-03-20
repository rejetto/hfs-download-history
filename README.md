# download-history

Track completed downloads and show per-entry history from the file menu.

<img width="266" height="519" alt="image" src="https://github.com/user-attachments/assets/77e05b39-af9d-42ce-a700-4eefca8e559f" />

## Features

- logs completed downloads only
- stores `finishedAt`, `ip`, `username`
- per-entry history in frontend file menu
- access control with fallback:
  - if `can_view` is configured, only selected users/groups can view
  - if `can_view` is empty, only admins can view
- retention cap per entry (`max_entries_per_file`, default `100`)
