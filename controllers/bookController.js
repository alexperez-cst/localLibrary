var Book = require('../models/book');
const Author = require('../models/author');
const BookInstance = require('../models/bookInstance');
const Genre = require('../models/genre');
const {body,validationResult} = require('express-validator');
const async = require('async');
const { populate } = require('../models/book');
exports.index = function (req, res) {
  async.parallel({
    book_count:(callback) => {
      Book.countDocuments({},callback);
    },
    book_instance_count: (callback) => {
      BookInstance.countDocuments({},callback);
    },
    book_instance_avaliable_count: callback => {
      BookInstance.countDocuments({status:'Available'},callback);
    },
    author_count: callback => {
      Author.countDocuments({},callback);
    },
    genre_count: callback => {
      Genre.countDocuments({},callback);
    }
  },(err,response) => {
    res.render('index',{title:'Local Library Home',error:err, data:response});
  })
};

// Display list of all books.
exports.book_list = function (req, res) {
  Book.find({}, 'title author')
    .populate('author').exec(function (err, list_books) {
      if (err) { return next(err); }
      //Successful, so render
      res.render('book_list', { title: 'Book List', book_list: list_books });
    });

};

// Display detail page for a specific book.
exports.book_detail = function (req, res,next) {
  async.parallel({
    book:(callback) => {
      Book.findById(req.params.id)
          .populate('author')
          .populate('genre')
          .exec(callback);
    },
    book_instance: (callback) => {
      BookInstance.find({'book':req.params.id})
                  .exec(callback);
    }},(err,results) => {
      if(err) return next(err);
      if(!results.book){
        let err = new Error('Book not found');
        err.status = 404;
        return next(err);
      }
      res.render('book_detail',{title:results.book.title,book:results.book,book_instance:results.book_instance});
    })
};

// Display book create form on GET.
exports.book_create_get = function (req, res,next) {
  async.parallel({
    genres:(callback) => {
      Genre.find(callback);
    },
    authors:(callback) => {
      Author.find(callback);
    }
  },(err,results) => {
    if(err) {return next(err)};
    res.render('book_form',{title:'Create Book',authors:results.authors,genres:results.genres});
  })
}
// Handle book create on POST.
exports.book_create_post = [
  (req,res,next) => {
    if(!(req.body.genre instanceof Array)){
      if(typeof req.body.genre === 'undefined') {req.body.genre = []}
      else req.body.genre = new Array(req.body.genre);
    }
    next();
  },
  body('title','Title must not be empty.').trim().isLength({min:1}).escape(),
  body('author','Author must not be empty.').trim().isLength({min:1}).escape(),
  body('summary','Summary must not be empty.').trim().isLength({min:1}).escape(),
  body('isbn','ISBN must not be empty').trim().isLength({min:1}).escape(),
  body('genre.*').escape(),
  (req,res,next) => {
    const errors = validationResult(req);

    const book = new Book({
      title: req.body.title,
      author: req.body.author,
      summary: req.body.summary,
      isbn: req.body.isbn,
      genre: req.body.genre
    });

    if(!errors.isEmpty()){
      async.parallel({
        genres:(callback) => {
          Genre.find(callback);
        },
        authors: (callback) => {
          Author.find(callback);
        }
      },(err,response) => {
        if(err) {return next(err)}
        for (let i = 0; i < results.genres.length; i++) {
          if (book.genre.indexOf(results.genres[i]._id) > -1) {
            results.genres[i].checked='true';
          }
        }
        res.render('book_form',{title:'Create Author',authors:response.authors,genres:response.genres,book:book,errors:errors.array()});
      })
    }
    else{
      book.save((err) => {
        if(err) {return next(err)}
        res.redirect(book.url);
      });
    }
  }
];

// Display book delete form on GET.
exports.book_update_get = function (req, res,next) {
  async.parallel({
    book:(callback) => {
      Book.findById(req.params.id).populate('populate').populate('genre').exec(callback);
    },
    authors:(callback) => {
      Author.find(callback);
    },
    genres: (callback) => {
      Genre.find(callback);
    }
  },(err,results) => {
    if(err) return next(err);
    if(!results.book){
      let err = new Error(err);
      err.status = 404;
      return next(err);
    }
    for(let genre = 0; genre < results.genres.length; genre++){
      for(let book = 0; book < results.book.length; book++){
        if(results.genres[genre]._id.toString()===results.book.genre[book]._id.toString()){
          results.genre[genre].checked='true';
        }
      }
    }
    res.render('book_form',{title: 'Update Book',book:results.book,authors:results.authors,genres:results.genres});
  })
};

// Handle book delete on POST.
exports.book_update_post = [
  (req,res,next) => {
    if(!(req.body.genre instanceof Array)){
      if(typeof req.body.genre==='undefined') req.body.genre=[];
      else req.body.genre=new Array(req.body.genre);
    }
    next();
  },
  body('title', 'Title must not be empty.').trim().isLength({ min: 1 }).escape(),
  body('author', 'Author must not be empty.').trim().isLength({ min: 1 }).escape(),
  body('summary', 'Summary must not be empty.').trim().isLength({ min: 1 }).escape(),
  body('isbn', 'ISBN must not be empty').trim().isLength({ min: 1 }).escape(),
  body('genre.*').escape(),
  (req,res,next) => {
    const errors = validationResult(req);

    const book = new Book({
      title:req.body.title,
      author:req.body.author,
      summary:req.body.summary,
      isbn:req.body.isbn,
      genre: req.body.genre ?? [],
      _id:req.params.id
    });

    if(!errors.isEmpty()) {
      async.parallel({
        authors: (callback) => {
          Author.find(callback);
        },
        genres: (callback) => {
          Genre.find(callback);
        }
      },(err,results) => {
        if(err) {return next(err)}
        for(let i = 0; i<results.genres.length;i++){
          if(book.genre.indexOf(results.genres[i]._id) > -1){
            results.genres[i].checked='true';
          }
        }
        return res.render('book_form',{title:'Update Book',book:book,authors:results.authors,genres:results.genres,errors:errors.array()});
      })
    }
    Book.findByIdAndUpdate(req.params.id,book,{},(err,the_book) => {
      if(err){return next(err)}
      res.redirect(the_book.url);
    })
  }
]

// Display book update form on GET.
exports.book_delete_get = function (req, res,next) {
   async.parallel({
        book:(callback) => {
            Book.findById(req.params.id).exec(callback);
        },
        book_instances:(callback) => {
            BookInstance.find({'book':{'_id':req.params.id}}).exec(callback);
        }
   },(err,results) => {
        if(err) return next(err);
        if(!results.book){
            return res.redirect('/catalog/books');
        }
        res.render('book_delete',{title:'Delete Book',book:results.book,book_instances:results.book_instances});
    })
};

// Handle book update on POST.
exports.book_delete_post = function (req, res) {
   async.parallel({
        book:(callback) => {
            Book.findById(req.params.id).exec(callback);
        },
        book_instances:(callback) => {
            BookInstance.find({'book':{'_id':req.params.id}}).exec(callback);
        }
    },(err,results) => {
        if(err) return next(err);
        if(results.book_instances.length > 0){
            return res.render('book_delete', {title:'Delete Book',book:results.book,book_instances:results.book_instances});
        }
        Book.findByIdAndRemove(req.body.bookid, (err) => {
            if(err) return next(err);
            res.redirect('/catalog/books');
        })
    });
};
