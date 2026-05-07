import fs from 'fs'
import path from 'path'

// Helper to flatten nested objects into key paths
function flatten(obj, prefix = '') {
  let result = {}
  for (const key in obj) {
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      Object.assign(result, flatten(obj[key], `${prefix}${key}.`))
    } else {
      result[`${prefix}${key}`] = obj[key]
    }
  }
  return result
}

// Helper to convert flattened key paths back to a nested object
function unflatten(lines) {
  const result = {}
  for (const line of lines) {
    // Skip empty lines or comment lines
    const trimmedLine = line.trim()
    if (!trimmedLine || trimmedLine.startsWith('#')) continue

    const separatorIndex = trimmedLine.indexOf('=')
    if (separatorIndex === -1) throw new Error("key separator not found")

    const keyPath = trimmedLine.slice(0, separatorIndex).trim()
    let rawValue = trimmedLine.slice(separatorIndex + 1).trim()

    let value = rawValue
    if (rawValue.startsWith('"') && rawValue.endsWith('"')) {
      // Parse escaped values as if it’s ordinary JSON string
      value = JSON.parse(rawValue)
    }

    const keys = keyPath.split('.')
    let current = result

    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) current[keys[i]] = {}
      current = current[keys[i]]
    }
    current[keys[keys.length - 1]] = value
  }
  return result
}

// Main execution
const inputFile = process.argv[2]

if (!inputFile) {
  console.error("Usage: npm run i18n <file>")
  process.exit(1)
}

const ext = path.extname(inputFile).toLowerCase()
const parsedPath = path.parse(inputFile)

if (ext === '.json') {
  try {
    const data = JSON.parse(fs.readFileSync(inputFile, 'utf-8'))
    const flattened = flatten(data)

    const outLines = []
    for (const [key, val] of Object.entries(flattened)) {
      // only escapes if val contains whitespace
      if (/[\s\"\n]/gi.test(val))
        outLines.push(`${key} = ${JSON.stringify(val)}`)
      else
        outLines.push(`${key} = ${val}`)
    }

    const outPath = path.join(parsedPath.dir, `${parsedPath.name}.txt`)
    fs.writeFileSync(outPath, outLines.join('\n'), 'utf-8')
    console.log(`Successfully converted JSON to i18n text file: ${outPath}`)
  } catch (err) {
    console.error("Error reading or parsing JSON:", err.message)
  }

} else if (ext === '.txt') {
  try {
    const content = fs.readFileSync(inputFile, 'utf-8')
    const lines = content.split(/\r?\n/)
    const unflattened = unflatten(lines)

    const outPath = path.join(parsedPath.dir, `${parsedPath.name}.json`)
    fs.writeFileSync(outPath, JSON.stringify(unflattened, null, 2), 'utf-8')
    console.log(`Successfully converted i18n text file to JSON: ${outPath}`)
  } catch (err) {
    console.error("Error reading or parsing i18n text file:", err.message)
  }

} else {
  console.error("Unsupported file extension. Please provide a .json or .txt file.")
  process.exit(1)
}
