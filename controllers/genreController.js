const Genre = require('../models/genre');
const Book = require('../models/book');
const async = require('async');
const {body, validationResult} = require('express-validator');
// Display list of all Genre.
exports.genre_list = function(req, res,next) {

    Genre.find()
         .sort([['name','ascending']])
         .exec((err,genreList) => {
             if(err) return next(err);
             res.render('genre_list',{title:'Genre List',genre_list:genreList});
         })
};

// Display detail page for a specific Genre.
exports.genre_detail = function(req, res,next) {
    async.parallel({
        genre: (callback) => {
            Genre.findById(req.params.id)
                 .exec(callback);
        },
        genre_books: (callback) => {
            Book.find({'genre': req.params.id})
                .exec(callback);
        }
    },(err,results) => {
        if(err) return next(err)
        if(!results.genre){
            let err = new Error('Genre not found');
            err.status = 404;
            return next(err);
        }
        res.render('genre_detail',{title: 'Genre Detail', genre:results.genre, genre_books:results.genre_books});
    })
};

// Display Genre create form on GET.
exports.genre_create_get = function(req, res) {
    res.render('genre_form', {title:'Create Genre'});
};

// Handle Genre create on POST.
exports.genre_create_post = [
    body('name','Genre name required').trim().isLength({min:1}).escape(),
    (req,res,next) => {
        const errors = validationResult(req);
        const genre = new Genre({
            name: req.body.name,
        });

        if(!errors.isEmpty()){
            return res.render('genre_form',{title:'Create Genre',genre:genre,errors:errors.array()});
        }
        Genre.findOne({name:req.body.name})
             .exec((err,foundedGenre) => {
                 if(err){return next(err)}

                 if(foundedGenre){
                     return res.redirect(foundedGenre.url);
                 }
                 genre.save(function(err){
                     if(err) {return next(err)}
                     res.redirect(genre.url);
                 });
             });

    }
]
// Display Genre delete form on GET.
exports.genre_delete_get = function(req, res,next) {
    async.parallel({
        genre:(callback) => {
            Genre.findById(req.params.id).exec(callback);
        },
        books:(callback) => {
            Book.find({'genre':{'_id':req.params.id}}).exec(callback);
        }
    },(err,results) => {
        if(err) return next(err);
        if(!results.genre){
            return res.redirect('/catalog/genres');
        }
        res.render('genre_delete',{title:'Delete Genre',genre:results.genre,genre_books:results.books});
    })
};

// Handle Genre delete on POST.
exports.genre_delete_post = function(req, res,next) {
    async.parallel({
        genre:(callback) => {
            Genre.findById(req.params.id).exec(callback);
        },
        books:(callback) => {
            Book.find({'genre':{'_id':req.params.id}}).exec(callback);
        }
    },(err,results) => {
        if(err) return next(err);
        if(results.books.length > 0){
            return res.render('genre_delete', {title:'Delete Genre',genre:results.genre,genre_books:results.books});
        }
        Genre.findByIdAndRemove(req.body.genreid, (err) => {
            if(err) return next(err);
            res.redirect('/catalog/genres');
        })
    });
}
// Display Genre update form on GET.
exports.genre_update_get = function(req, res,next) {
    Genre.findById(req.params.id).exec((err,genre) => {
        if(err) return next(err);
        if(!genre) return res.redirect('/catalog/genres');
        res.render('genre_form',{title:'Update Genre',genre:genre});
    })
};

// Handle Genre update on POST.
exports.genre_update_post = [
    body('name','Genre name required').trim().isLength({min:1}).escape(),
    function(req, res,next) {
        const errors = validationResult(req);
        const genre = new Genre({
            name:req.body.name,
            _id:req.params.id
        });
        if(!errors.isEmpty()){
            return res.render('genre_form',{title:'Update Genre',genre:genre,errors:errors.array()});
        }
        Genre.findByIdAndUpdate(req.params.id,genre,{},(err,newGenre) => {
            if(err) return next(err);
            res.redirect(newGenre.url);
        })
    }
];
