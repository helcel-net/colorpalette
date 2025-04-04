import { defineConfig } from "@rsbuild/core";
import { pluginVue } from "@rsbuild/plugin-vue";

export default defineConfig({
    plugins: [pluginVue()],
    output: {
        // Please replace <REPO_NAME> with the repository name.
        // For example, "/my-project/"
        assetPrefix: "/colorpalette/",
    },
});
