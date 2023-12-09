import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import svgLoader from 'vite-svg-loader';

export default ({ mode }) => {
    return defineConfig({
        plugins: [react(), svgLoader({
            defaultImport: 'url'
          })],
        define: {
            "process.env.NODE_ENV": `"${mode}"`,
        },
        server: {
            proxy: {
                '/api': 'http://127.0.0.1:3000',
            }},
    })
}