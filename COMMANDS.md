# Athera Agent — Command Status

Last updated: Sep 10, 2026

## ✅ Confirmed Working

| Command | Example phrase | Tool called | Notes |
|---------|---------------|-------------|-------|
| List files | "list all the files on my desktop" | list_files | Approval widget appears; drag to a Space adds files (74 files tested in My Ideas) |
| Create space | "create a space called My Ideas" | create_space | Space appears in Spaces panel and top nav |
| Life update | "I started a new semester at UC Berkeley" → "yes" | life_action | Creates space, scans Berkeley/semester files; retry-after-delete bug fixed Sep 10 |
| Delete space | trash icon on Spaces panel row | DELETE /api/spaces/[slug] | Removes space metadata only; files on disk untouched |
| Voice pipeline | tap mic → speak | /api/voice/chat | Ollama llama3.1:8b + Kokoro af_bella TTS verified |
| Text input | type message → Enter | /api/voice/chat | Same backend as voice (added Sep 10; smoke-tested) |
| Time | "what time is it" | time | User confirmed Sep 10, 2026. Response: Marked working from /commands page |
| Battery | "what's my battery" | get_battery | User confirmed Sep 10, 2026. Response: Marked working from /commands page |
| Send email | can you send a email to rheanna.gm@berkeley.edu saying " the first email from Athera " | send_email | User confirmed Sep 10, 2026. Response: Email sent to Rheanna's Berkeley email. |
| List files | "yes please" | list_files | User confirmed Sep 10, 2026. Response: Listed 76 items. A floating widget appeared — drag it onto a Space to save these |

## ❌ Broken / Not Working

| Command | Example phrase | Error | Fix needed |
|---------|---------------|-------|------------|
| WiFi | "what Wi-Fi am I on" | it said no wifi when i was connected to a wifi network | Reported Sep 10, 2026 |
| Open app | "can you open Spotify please" | we just havent tested this properly because spotify is not downloaded on this device | Reported Sep 10, 2026 |
| Create note | "can you save a note for me like open a note and type hi my name is Rihanna and then save it" | it didnt save a note with what i said | Reported Sep 10, 2026 |

## ⏳ Not Yet Tested

| Command | Example phrase | Tool |
|---------|---------------|------|
| Set reminder | "remind me to..." | set_reminder |
| Search files | "find files named..." | search_files |
| Clipboard read | "what's in my clipboard" | get_clipboard |
| Clipboard write | "copy hello to clipboard" | set_clipboard |
| Volume get | "what's the volume" | get_volume |
| Volume set | "set volume to 50" | set_volume |
| Web search | "search for UC Berkeley calendar" | web_search |
| Screenshot | "take a screenshot" | take_screenshot |
| Capabilities | "what can you do" | capabilities |
| Read file | "read ~/Documents/note.txt" | read_file |
| Find file | "find file named report" | find_file |
| Open file | "open Berkeley syllabus" | open_file |
| Open folder | "open my Downloads folder" | open_folder |
| System info | "get system info" | get_system_info |
| List spaces | "list my spaces" | list_spaces |
| Check email | "check my email" | check_email |
| Search email | "find emails from Rheanna" | search_email |
| Scan email to spaces | "scan my email" | scan_email_for_spaces |
