/**
 *  This file contains the variables used in other gulp files
 *  which defines tasks
 *  By design, we only put there very generic config values
 *  which are used in several places to keep good readability
 *  of the tasks
 */

/**
 *  The main paths of your project handle these with care
 */
module.exports = {
  paths: {
    scripts: ['app/scripts/**/*.js'],
    appScripts: ['app/**/*.js', '!app/**/*.spec.js'],
    images: 'app/images/**/*',
    html: 'app/**/*.html',
    indexHtml: './index.html',
    // styles: {
    //   sass: 'app/styles/**/*.scss',
    //   css: 'app/styles/*.css'
    // },
    notLinted: ['!app/scripts/templates.js'],
    dist: 'dist',
    tmp: '.tmp',
    e2e: 'e2e',
    src: '.'
  },
  templatesModule: 'EnvironmentManager.templates',
  /**
   *  Common implementation for an error handler of a Gulp plugin
   */
  errorHandler: function(title) {

    return function(err) {
      console.error('[' + title + ']',  err.toString());
      this.emit('end');
    };
  }
};
