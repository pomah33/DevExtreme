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
    ...renovationInput,
    ...jsInput,
}

export default [{
    input,
    external: [
        /__internal/,
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
            resolveId(importee, importer, resolveOptions) {                
                if (resolveOptions.isEntry) {
                    return null;
                }
                
                const find = 'renovation';
                const replace = 'renovation/dist';

                let newImportee;

                if (importee.includes(find)) {
                    newImportee = importee.replace(find, replace);
                } else if (importer.includes(find)) {
                    if (!path.join(path.dirname(importer), '..', importee).includes(find)) {
                        newImportee =  path.join('..', importee);
                    }
                }

                if (!newImportee) {
                    return;
                }

                return this.resolve(newImportee, importer, {...resolveOptions, skipSelf: true});
            }
        }
    ],
    treeshake: false,
}];
