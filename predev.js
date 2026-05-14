import fs from 'fs/promises'
import { spawn } from 'child_process'

const requiredFilesByScript = [
  {
    script: 'fetch-schedule',
    files: ['src/data/schedule.json'],
  },
  {
    script: 'convert-staff',
    files: ['src/data/staff.json', 'src/data/teams.json'],
  },
]

async function fileExists(filePath) {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

async function runNpmScript(script) {
  const npmExecPath = process.env.npm_execpath
  const command = npmExecPath ? process.execPath : process.platform === 'win32' ? 'npm.cmd' : 'npm'
  const args = npmExecPath ? [npmExecPath, 'run', script] : ['run', script]

  await new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
    })

    child.on('error', reject)
    child.on('exit', code => {
      if (code === 0) {
        resolve()
        return
      }

      reject(new Error(`npm run ${script} failed with exit code ${code}`))
    })
  })
}

for (const { script, files } of requiredFilesByScript) {
  const missingFiles = []

  for (const file of files) {
    if (!(await fileExists(file))) {
      missingFiles.push(file)
    }
  }

  if (missingFiles.length === 0) {
    continue
  }

  console.log(`Missing ${missingFiles.join(', ')}. Running npm run ${script}...`)
  await runNpmScript(script)
}
