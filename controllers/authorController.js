const Author = require('../models/author');
const Book = require('../models/book');
const async = require('async');
const {body,validationResult} = require('express-validator');
exports.author_list = (req,res,next) => {
    Author.find()
          .sort([['family_name','ascending']])
          .exec((err,authorList) => {
              if(err) {return next(err)}
              res.render('author_list',{title:'Author List', author_list:authorList});
          });
};

exports.author_detail = (req,res,next) => {
    async.parallel({
        author:(callback) => {
            Author.findById(req.params.id)
                  .exec(callback);
        },
        author_books:(callback) => {
            Book.find({'author':req.params.id},'title summary')
                .exec(callback);
        }
    }, (err,response) => {
        if(err) return next(err);
        if(!response.author){
            let err = new Error('Author not found');
            err.status = 404;
            return next(err);
        }
        res.render('author_detail',{title:'Author Details',author:response.author,author_books:response.author_books})
    })
};

exports.author_create_get = (req,res) => {
    res.render('author_form',{title:'Create Author'});
};

exports.author_create_post = [
    body('first_name').trim().isLength({min:1}).escape().withMessage('First name must be specified.')
                      .isAlphanumeric().withMessage('First name has non-alphanumeric characters'),
    body('family_name').trim().isLength({min:1}).escape().withMessage('Family name must be specified.')
                       .isAlphanumeric().withMessage('Family name has non-alphanumeric characters'),
    body('date_of_birth','Invalid date of birth').optional({checkyFalse:true}).isISO8601().toDate(),
    body('date_of_death','Invalid date of death').optional({checkyFalse:true}).isISO8601().toDate(),
    (req,res,next) => {
        const errors = validationResult(req);

        if(!errors.isEmpty()){
            return res.render('author_form',{title:'Create Author', author:req.body, errors: errors.array()});
        }
        const author = new Author({
            first_name: req.body.first_name,
            family_name: req.body.family_name,
            date_of_birth: req.body.date_of_birth,
            date_of_death: req.body.date_of_death,
        });
        author.save((err) => {
            if(err) {return next(err)}
            res.redirect(author.url);
        })
    }
];
// Display Author delete form on GET.
exports.author_delete_get = function(req, res,next) {
  async.parallel({
    author:(callback) => {
      Author.findById(req.params.id).exec(callback);
    },
    author_books:(callback) => {
      Book.find({'author':req.params.id})
          .exec(callback)
    }
  },(err,results) => {
    if(err) return next(err);
    if(!results.author){
      res.redirect('/catalog/authors');
    }
    res.render('author_delete',{title:'Delete Author',author:results.author,author_books:results.author_books});
  })
};

// Handle Author delete on POST.
exports.author_delete_post = function(req,res,next) {
  async.parallel({
    author:(callback) => {
      Author.findById(req.params.id).exec(callback);
    },
    author_books: (callback) => {
      Book.find({'author':req.params.id}).exec(callback);
    }
  },(err,results) => {
    if(err) return next(err);
    if(results.author_books.length > 0){
      res.render('author_delete',{title:'Delete Author', author:results.author,author_books:results.author_books});
      return;
    }
    Author.findByIdAndRemove(req.body.authorid, (err) => {
      if(err) return next(err);
      res.redirect('/catalog/authors');
    })
  })
}

// Display Author update form on GET.
exports.author_update_get = function(req, res,next) {
  Author.findById(req.params.id)
        .exec((err,author) => {
          if(err) return next(err);
          if(!author) return res.redirect('/catalog/authors');
          res.render('author_form',{title:'Update Author',author:author});
        });
};

// Handle Author update on POST.
exports.author_update_post = [
  body('first_name').trim().isLength({min:1}).escape().withMessage('First name must be specified.')
                      .isAlphanumeric().withMessage('First name has non-alphanumeric characters'),
  body('family_name').trim().isLength({min:1}).escape().withMessage('Family name must be specified.')
                       .isAlphanumeric().withMessage('Family name has non-alphanumeric characters'),
  function(req, res,err) {
    const errors = validationResult(req);

    const author = new Author({
      first_name:req.body.first_name,
      family_name:req.body.family_name,
      date_of_birth:req.body.date_of_birth,
      date_of_death:req.body.date_of_death,
      _id:req.params.id,
    });

    if(!errors.isEmpty()){
      return res.render('author_form',{title:'Update Author',author:author,errors:errors.array()});
    }
    Author.findByIdAndUpdate(req.params.id,author,{},(err,newAuthor) => {
      if(err) return next(err);
      res.redirect(newAuthor.url);
    })
  }
]
