'use strict';

const gulp = require('gulp');
const path = require('canonical-path');
const taskListing = require('gulp-task-listing');

const angulario = '../angular.io';

gulp.task('get-sidenav-data', cb => {
  const baseDir = path.join(angulario, 'public/docs');
  return gulp.src([
    `${baseDir}/*/latest/**/_data.json`,
    `!${baseDir}/*/latest/api/**/*`,
  ], { base: baseDir })
    .pipe(gulp.dest('src/assets/sidenav'));
});

gulp.task('default', ['help']);

gulp.task('help', taskListing.withFilters((taskName) => {
  var isSubTask = taskName.substr(0, 1) == "_";
  return isSubTask;
}, function (taskName) {
  var shouldRemove = taskName === 'default';
  return shouldRemove;
}));