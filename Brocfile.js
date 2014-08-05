

var mergeTrees = require('broccoli-merge-trees');
var concatenate = require('broccoli-concat');

var pickFiles = require('broccoli-static-compiler');
var hbsTemplateCompiler = require('broccoli-ember-hbs-template-compiler');


var fs = require('fs');
var _ = require('underscore');
_.str = require('underscore.string');

var emberAppTree = './';

var targets = ['bower_components'];

var compileHandlebars = function(inputTree) {

    return hbsTemplateCompiler(inputTree);

};

var pickHandlebarsFiles = function(inputTree, outputTreeName) {
    return pickFiles(inputTree, {
        srcDir : '.',
        destDir : '/' + outputTreeName + '/templates',
        files: ['**/*.hbs']
    });
};


var reduceEmberTree = function(inputTree, outputTreeName) {

    var commonHbsJs = compileHandlebars(pickHandlebarsFiles(inputTree));

    var commonJs = pickFiles(inputTree, {
        srcDir : '.',
        destDir : '/' + outputTreeName + '/',
        files : ['**/*.js']
    });

    var mergedCommonJs = concatenate(mergeTrees([commonHbsJs, commonJs]), {
        inputFiles : ['**/*.js'],
        outputFile : '/' + outputTreeName + '/umbrella-ember-' + outputTreeName + '.js',
        separator : '\n'
    });

    return mergedCommonJs;

};

var result = mergeTrees(_.map(targets, function(elem) {

    var currentTree = emberAppTree + '/' + elem;

    return reduceEmberTree(currentTree, elem);

}));


module.exports = result;
