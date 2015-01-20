var gulp = require('gulp');

var browserify = require('browserify');
var reactify = require('reactify');
var source = require('vinyl-source-stream');

gulp.task('default', function() {
    var bundler = browserify({ debug: true })
        .require(require.resolve('./examples/example.jsx'), { entry: true })
        .transform(reactify);

    return bundler.bundle()
        .pipe(source('bundle.js'))
        .pipe(gulp.dest('./examples'));
});