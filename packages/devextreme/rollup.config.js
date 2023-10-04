/* eslint-disable no-undef */
/* eslint-disable spellcheck/spell-checker */
import * as glob from 'glob';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import del from 'rollup-plugin-delete';


export default [{
    input: Object.fromEntries(
        glob.sync('js/**/*', {
            ignore: [
                'js/**/*.d.ts',
                'js/renovation/**/*',
                'js/__internal/**/*',
                '**/*.json',
                'js/bundles/**/*'
            ],
            nodir: true,
        }).map(file => [
            path.relative(
                'js',
                file.slice(0, file.length - path.extname(file).length)
            ),
            fileURLToPath(new URL(file, import.meta.url))
        ])
    ),
    external: [
        /renovation/,
        /__internal/
    ],
    output: [
        {
            format: 'es',
            dir: 'dist',
            preserveModules: true,
        }
    ],
    plugins: [
        del({ targets: 'dista/*' }),
    ],
    treeshake: false
}];
