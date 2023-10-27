/* eslint-disable no-undef */
/* eslint-disable spellcheck/spell-checker */
import glob from 'glob';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import del from 'rollup-plugin-delete';
import alias from '@rollup/plugin-alias';

const jsInput = Object.fromEntries(
    glob.sync('js/**/*', {
        ignore: [
            'js/**/*.d.ts',
            'js/renovation/**/*',
            'js/__internal/**/*',
            'js/bundles/**/*',
            'js/localization/**/*',
            '**/*.json',
        ],
        nodir: true,
    }).map(file => [
        path.relative(
            'js',
            file.slice(0, file.length - path.extname(file).length)
        ),
        fileURLToPath(new URL(file, import.meta.url))
    ])
);

const renovationInput = Object.fromEntries(
    glob.sync('js/renovation/dist/**/*', {
        nodir: true,
    }).map(file => [
        path.relative(
            'js',
            file.slice(0, file.length - path.extname(file).length)
        ),
        fileURLToPath(new URL(file, import.meta.url))
    ])
);

const input = {
    // ...renovationInput,
    ...jsInput,
}

const inputByFiles = Object.fromEntries(Object.entries(input).map(([a, b]) => [b, a]));

export default [{
    input,
    external: [
        /__internal/,
        /renovation/,
    ],
    output: [
        {
            format: 'es',
            dir: 'dist/esm',
            preserveModules: true,
        },
        {
            format: 'cjs',
            dir: 'dist/cjs',
            preserveModules: true,
        },
        // {
        //     format: 'packagejsonlink',
        //     dir: 'dist',
        //     preserveModules: true,
        // }
    ],
    plugins: [
        del({ targets: 'dist/*' }),
        {
            name: 'a',
            resolveId(source, importer, options) {
                if (options.isEntry) {
                    return;
                }

                console.log(source, importer, options);  
            },
        }
    ],
    treeshake: false
}];
