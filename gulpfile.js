var	gulp      	= require('gulp'),
	runSequence  = require('run-sequence'),
	notify      = require('gulp-notify'),
	pug      	= require('gulp-pug'),
	sass      	= require('gulp-sass'),
	cleanCSS 	= require('gulp-clean-css'),
	autoprefixer= require('gulp-autoprefixer'),
	sourcemaps 	= require('gulp-sourcemaps'),
	minify 		= require('gulp-minify'),
	concat 		= require('gulp-concat'),
	flatten 	= require('gulp-flatten'),
	imagemin    = require('gulp-imagemin'),
	conf 	= {
		pug:{
			watch:['assets/templates/*.pug','assets/templates/**/*.pug'],
			src:['assets/templates/*.pug','assets/templates/**/*.pug'],
			dest:'templates/'
		},
		sass:{
			watch:['assets/styles/*.scss','assets/styles/**/*.scss'],
			src:['assets/styles/*.scss'],
			dest:'dist/styles/'
		},
		js:{
			watch:['assets/scripts/*.js'],
			src:['assets/scripts/*.js'],
			watchApp:['assets/scripts/app/*.js'],
			srcApp:['assets/scripts/app/*.js'],
			dest:'dist/scripts/'
		},
		font:{
			watch:['assets/fonts/*.*','assets/fonts/**/*.*'],
			src:['assets/fonts/*.*','assets/fonts/**/*.*'],
			dest:'dist/fonts/'	
		},
		image:{
			watch:['assets/images/*.*','assets/images/**/*.*'],
			src:['assets/images/*.*','assets/images/**/*.*'],
			dest:'dist/images/'	
		}
	};

gulp.task('tpug' , function(){
	return gulp.src(conf.pug.src)
	      .pipe(pug({
	        pretty: true
	      }).on('error' , function(msg){
	        console.log('errorr pug :: ' + msg);
	        this.emit('end');
	      }))
	      // .pipe(notify("Pug Done !"))
	      .pipe(gulp.dest(conf.pug.dest));
});

gulp.task('tsass' , function(){
	return gulp.src(conf.sass.src)
			.pipe(sourcemaps.init())
	      	.pipe(sass().on('error' , function(msg){
	        	console.log('errorr sass :: ' + msg);
	        	this.emit('end');
	      	}))
	 		.pipe(autoprefixer({
	 			browsers: ['last 2 versions']
	 		}))
	 		.pipe(cleanCSS())
	 		.pipe(sourcemaps.write('.'))
	 		// .pipe(notify("CSS Done !"))
	      	.pipe(gulp.dest(conf.sass.dest));
});

gulp.task('tjs' , function(){
	return gulp.src(conf.js.src)
			.pipe(sourcemaps.init())
	      	.pipe(minify({
		        ext:{
		            src:'-debug.js',
		            min:'.js'
		        }
		    }).on('error' , function(msg){
		    	console.log('errorr TJS :: ' + msg);
	        	this.emit('end');
		    }))
	 		.pipe(sourcemaps.write())
	 		// .pipe(notify("JS Done !"));
	      	.pipe(gulp.dest(conf.js.dest))
});

gulp.task('tappjs' , function(){
	return gulp.src(conf.js.srcApp)
			.pipe(sourcemaps.init())
		    .pipe(concat('app.js'))
	      	.pipe(minify({
		        ext:{
		            src:'-debug.js',
		            min:'.js'
		        }
		    }).on('error' , function(msg){
		    	console.log('errorr TAPPJS :: ' + msg);
	        	this.emit('end');
		    }))
	 		.pipe(sourcemaps.write())
	 		// .pipe(notify("App JS Done !"))
	      	.pipe(gulp.dest(conf.js.dest));
});
gulp.task('tfont', function() {
  return gulp.src(conf.font.src)
    .pipe(flatten())
    // .pipe(notify("Fonts Done !"))
    .pipe(gulp.dest(conf.font.dest));
});
gulp.task('timage', function() {
  return gulp.src(conf.image.src)
    .pipe(imagemin({
      progressive: true,
      interlaced: true,
      svgoPlugins: [{removeUnknownsAndDefaults: false}, {cleanupIDs: false}]
    }))
    // .pipe(notify("Image done!"))
    .pipe(gulp.dest(conf.image.dest));
});
gulp.task('build', function(callback) {
	runSequence('tpug','tsass','tjs','tappjs','tfont','timage',callback);
});
// gulp.task('clean', require('del').bind(null, [path.dist]));
// gulp.task('rebuild', ['clean'], function() {
//   gulp.start('build');
// });
gulp.task('watch' , function(){
	gulp.watch([conf.pug.watch], ['tpug']);
	gulp.watch([conf.sass.watch], ['tsass']);
	gulp.watch([conf.js.watch], ['tjs']);
	gulp.watch([conf.js.watchApp], ['tappjs']);
	gulp.watch([conf.font.watch], ['tfont']);
	gulp.watch([conf.image.watch], ['timage']);
});
gulp.task('default' , ['watch']);