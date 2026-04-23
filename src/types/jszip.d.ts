// Minimal type stub so tsc is happy in environments where jszip isn't installed.
// The real package ships full types when `npm install` runs.
declare module 'jszip' {
  interface JSZipObject {
    async(type: 'text'): Promise<string>
    dir: boolean
    name: string
  }
  interface JSZip {
    file(name: string): JSZipObject | null
    files: Record<string, JSZipObject>
  }
  interface JSZipStatic {
    loadAsync(data: File | ArrayBuffer | Uint8Array | string): Promise<JSZip>
  }
  const JSZip: JSZipStatic
  export default JSZip
}
