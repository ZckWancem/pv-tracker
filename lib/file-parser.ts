import Papa from "papaparse"
import * as XLSX from "xlsx"

export type ParsedPanelData = {
  pallet_no: string
  serial_code: string
}

export function parseCSV(file: File): Promise<ParsedPanelData[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const data = results.data as Record<string, unknown>[]
          const parsed = data
            .map((row) => ({
              pallet_no: String(row.pallet_no || row["Pallet No"] || "").trim(),
              serial_code: String(row.serial_code || row["Serial Code"] || "").trim(),
            }))
            .filter((item) => item.pallet_no && item.serial_code)

          resolve(parsed)
        } catch (error) {
          reject(error)
        }
      },
      error: (error) => reject(error),
    })
  })
}

export function parseExcel(file: File): Promise<ParsedPanelData[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: "array" })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet)

        const parsed = (jsonData as Record<string, unknown>[])
          .map((row) => ({
            pallet_no: String(row.pallet_no || row["Pallet No"] || "").trim(),
            serial_code: String(row.serial_code || row["Serial Code"] || "").trim(),
          }))
          .filter((item) => item.pallet_no && item.serial_code)

        resolve(parsed)
      } catch (error) {
        reject(error)
      }
    }

    reader.onerror = () => reject(new Error("Failed to read file"))
    reader.readAsArrayBuffer(file)
  })
}
