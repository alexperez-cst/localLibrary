var BookInstance = require('../models/bookInstance');
const {body,validationResult} = require('express-validator');
const Book = require('../models/book');
const async = require('async');
// Display list of all BookInstances.
exports.bookinstance_list = function (req, res,next) {
  BookInstance.find()
              .populate('book')
              .exec((err,listBookInstances) => {
                if(err) {return next(err)}
                res.render('bookinstance_list',{title:'Book Instance List',bookinstance_list:listBookInstances});
              })
};

// Display detail page for a specific BookInstance.
exports.bookinstance_detail = function (req, res,next) {
  BookInstance.findById(req.params.id)
              .populate('book')
              .exec((err,response) => {
                if(err) return next(err);
                if(response === null){
                  const err = new Error('BookInstance not found');
                  err.status = 404;
                  return next(err);
                }
                res.render('bookinstance_detail',{title:`Copy: ${response.book.title}`, bookinstance:response});
              })
};

// Display BookInstance create form on GET.
exports.bookinstance_create_get = function (req, res,next) {
  Book.find({},'title')
      .exec((err,book_titles) => {
        if(err) return next(err)
        res.render('bookinstance_form', {title: 'Create Book Instance',book_list:book_titles})
      });
};

// Handle BookInstance create on POST.
exports.bookinstance_create_post = [
  body('book', 'Book must be specified').trim().isLength({min:1}).escape(),
  body('imprint', 'Imprint must be specified').trim().isLength({min:1}).escape(),
  body('status').escape(),
  body('due_back','Invalid date').optional({checkFalsy:true}).isISO8601().toDate(),
  (req,res,next) => {
    const errors = validationResult(req);

    const bookinstance = new BookInstance({
      book: req.body.book,
      imprint: req.body.imprint,
      status:req.body.status,
      due_back: req.body.due_back
    });

    if(!errors.isEmpty()){
      Book.find({},'title')
          .exec((err,books) => {
            if(err) return next(err);
            res.render('bookinstance_form', {title: 'Create Book Instance', book_list: books, selected_book: bookinstance.book._id, errors: errors.array(), bookinstance:bookinstance});
          });
      return;
    }
    bookinstance.save((err) => {
      if(err) return next(err);
      res.redirect(bookinstance.url);
    })
  }
]

// Display BookInstance delete form on GET.
exports.bookinstance_delete_get = function (req, res,next) {
  BookInstance.findById(req.params.id)
              .populate('book')
              .exec((err,data) => {
                  if(err) return next(err);
                  if(!data){
                    return res.redirect('/catalog/bookinstances');
                  }
                  res.render('bookinstance_delete',{title:'Delete Book Instance', book_instance:data});
              })
};

// Handle BookInstance delete on POST.
exports.bookinstance_delete_post = function (req, res,next) {
  BookInstance.findByIdAndRemove(req.body.bookinstanceid,(err,data) =>{
    if(err) return next(err);
    res.redirect('/catalog/bookinstances');
  })
};

// Display BookInstance update form on GET.
exports.bookinstance_update_get = function (req, res,next) {
  async.parallel({
    bookinstance:(callback) => {
       BookInstance.findById(req.params.id)
                   .exec(callback);
    },
    books:(callback) => {
      Book.find({},'title')
          .exec(callback);
    }
  },(err,results) => {
    if(err) return next(err);
    if(!results.bookinstance){
      let err = new Error(err);
      err.status = 404;
      return next(err);
    }
    res.render('bookinstance_form',{title:'Update Book Instance',bookinstance:results.bookinstance,book_list:results.books});
  });
}
// Handle bookinstance update on POST.
exports.bookinstance_update_post = [
  body('book', 'Book must be specified').trim().isLength({min:1}).escape(),
  body('imprint', 'Imprint must be specified').trim().isLength({min:1}).escape(),
  body('status').escape(),
  body('due_back','Invalid date').optional({checkFalsy:true}).isISO8601().toDate(),
  (req,res,next) => {
    const errors = validationResult(req);

    const bookinstance = new BookInstance({
      book: req.body.book,
      imprint: req.body.imprint,
      status:req.body.status,
      due_back: req.body.due_back,
      _id: req.params.id,
    });

    if(!errors.isEmpty()) {
       Book.find({},title).exec((err,results) => {
        if(err) {return next(err)}
        return res.render('bookinstance_form',{title:'Update Book Instance',bookinstance:bookinstance,book_list:results,errors:errors.array()});
      })
    }
    BookInstance.findByIdAndUpdate(req.params.id,bookinstance,{},(err,the_book) => {
      if(err){return next(err)}
      res.redirect(the_book.url);
    });
  }
]
