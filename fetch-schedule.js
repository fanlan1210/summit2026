import fs from 'fs/promises'
import path from 'path'
import 'dotenv/config'
import { scheduleToJson } from 'opass-schedule-to-json'

const schedule = await scheduleToJson({
  apiKey: process.env.GCP_API_KEY,
  spreadsheetId: process.env.SPREADSHEET_ID,
  avatarBaseUrl: process.env.AVATAR_BASE_URL,
  defaultAvatar: process.env.DEFAULT_AVATAR,
})

const filePath = 'src/data/schedule.json'
await fs.mkdir(path.dirname(filePath), { recursive: true })
fs.writeFile(path.resolve(filePath), JSON.stringify(schedule, null, 2), 'utf-8')
