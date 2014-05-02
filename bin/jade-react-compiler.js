#!/usr/bin/env node

/*
(The MIT License)

Copyright (c) 2009-2014 TJ Holowaychuk <tj@vision-media.ca>
Copyright (c) 2014 Michael Phan-Ba <michael@mikepb.com>

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

/**
 * Module dependencies.
 */

var fs = require('fs')
  , program = require('commander')
  , path = require('path')
  , basename = path.basename
  , dirname = path.dirname
  , resolve = path.resolve
  , exists = fs.existsSync || path.existsSync
  , join = path.join
  , monocle = require('monocle')()
  , mkdirp = require('mkdirp')
  , jade = require('../');

global.React = require('react');

// jade options

var options = {};

// options

program
  .version(require('../package.json').version)
  .usage('[options] [dir|file ...]')
  .option('-O, --obj <str>', 'javascript options object')
  .option('-o, --out <dir>', 'output the compiled html to <dir>')
  .option('-p, --path <path>', 'filename used to resolve includes')
  .option('-P, --pretty', 'compile pretty html output')
  .option('-c, --client', 'compile function for client-side runtime.js')
  .option('-D, --no-debug', 'compile without debugging (smaller functions)')
  .option('-w, --watch', 'watch files for changes and automatically re-render')

program.on('--help', function(){
  console.log('  Examples:');
  console.log('');
  console.log('    # translate jade the templates dir');
  console.log('    $ jade templates');
  console.log('');
  console.log('    # create {foo,bar}.js');
  console.log('    $ jade {foo,bar}.jade');
  console.log('');
  console.log('    # jade over stdio');
  console.log('    $ jade < my.jade > my.js');
  console.log('');
  console.log('    # jade over stdio');
  console.log('    $ echo \'h1 Jade!\' | jade');
  console.log('');
  console.log('    # foo, bar dirs rendering to /tmp');
  console.log('    $ jade foo bar --out /tmp ');
  console.log('');
});

program.parse(process.argv);

// options given, parse them

if (program.obj) {
  if (exists(program.obj)) {
    options = JSON.parse(fs.readFileSync(program.obj));
  } else {
    options = eval('(' + program.obj + ')');
  }
}

// --filename

if (program.path) options.filename = program.path;

// --no-debug

options.compileDebug = program.debug;

// --client

options.client = program.client;

// --pretty

options.pretty = program.pretty;

// --watch

options.watch = program.watch;

// left-over args are file paths

var files = program.args;

// compile files

if (files.length) {
  console.log();
  files.forEach(renderFile);
  if (options.watch) {
    monocle.watchFiles({
      files: files,
      listener: function(file) {
        renderFile(file.absolutePath);
      }
    });
  }
  process.on('exit', function () {
    console.log();
  });
// stdio
} else {
  stdin();
}

/**
 * Compile from stdin.
 */

function stdin() {
  var buf = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', function(chunk){ buf += chunk; });
  process.stdin.on('end', function(){
    var output;
    if (options.client) {
      output = jade.compileClient(buf, options);
    } else {
      var fn = jade.compile(buf, options);
      output = React.renderComponentToStaticMarkup(fn(options));
    }
    process.stdout.write(output);
  }).resume();

  process.on('SIGINT', function() {
    process.stdout.write('\n');
    process.stdin.emit('end');
    process.stdout.write('\n');
    process.exit();
  })
}

/**
 * Process the given path, compiling the jade files found.
 * Always walk the subdirectories.
 */

function renderFile(path) {
  var re = /\.jade$/;
  fs.lstat(path, function(err, stat) {
    if (err) throw err;
    // Found jade file
    if (stat.isFile() && re.test(path)) {
      fs.readFile(path, 'utf8', function(err, str){
        if (err) throw err;
        options.filename = path;
        var output = jade.compileClient(str, options);
        var extname = '.js';
        path = path.replace(re, extname);
        if (program.out) path = join(program.out, basename(path));
        var dir = resolve(dirname(path));
        mkdirp(dir, 0755, function(err){
          if (err) throw err;
          fs.writeFile(path, output, function(err){
            if (err) throw err;
            console.log('  \033[90mrendered \033[36m%s\033[0m', path);
          });
        });
      });
    // Found directory
    } else if (stat.isDirectory()) {
      fs.readdir(path, function(err, files) {
        if (err) throw err;
        files.map(function(filename) {
          return path + '/' + filename;
        }).forEach(renderFile);
      });
    }
  });
}
