/// <reference types="vite/client" />
/// <reference types="electron-vite/node" />

declare module '*?asset' {
  const content: string
  export default content
}
