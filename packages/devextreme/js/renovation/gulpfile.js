/* eslint-disable import/no-commonjs */

const gulp = require('gulp');
const { InfernoGenerator } = require('@devextreme-generator/inferno');
const { generateComponents } = require('@devextreme-generator/build-helpers');
const del = require('del');
const babel = require('gulp-babel');
const transpileConfig = require('../../build/gulp/transpile-config');
const ts = require('gulp-typescript');

const SRC = [
    '**/*.{tsx,ts}',
    '!dist/**',
    '!**/*.d.ts',
    '!**/__tests__/**/*',
    '!test_utils/**/*'
];

gulp.task('clean', (cb) => {
    del.sync('dist');
    cb();
});

gulp.task('generate-jquery-components', () => {
    const tsProject = ts.createProject('./tsconfig.json');

    const generator = new InfernoGenerator();
    generator.options = {
        defaultOptionsModule: '../js/core/options/utils',
        jqueryComponentRegistratorModule: '../js/core/component_registrator',
        jqueryBaseComponentModule: 'component_wrapper/common/component',
        generateJQueryOnly: true
    };

    return gulp.src(SRC)
        .pipe(generateComponents(generator, { excludePathPatterns: ['__internal'], }))
        .pipe(tsProject())
        .pipe(babel(transpileConfig.esm))
        .pipe(gulp.dest('dist/'));
});

gulp.task('generate-inferno-components', () => {
    const tsProject = ts.createProject('./tsconfig.json');

    const generator = new InfernoGenerator();
    generator.options = {
        defaultOptionsModule: '../js/core/options/utils',
        jqueryComponentRegistratorModule: '../js/core/component_registrator',
        jqueryBaseComponentModule: 'component_wrapper/common/component',
    };

    // const errors = [];

    return gulp.src(SRC)
        .pipe(generateComponents(generator, { excludePathPatterns: ['__internal'], }))
        .pipe(tsProject())
        .pipe(babel(transpileConfig.esm))
        .pipe(gulp.dest('./dist'));
});

gulp.task('build-renovation-temp', gulp.series(
    'clean',
    'generate-jquery-components',
    'generate-inferno-components'
));
