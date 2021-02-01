const {DateTime} = require('luxon');
const mongoose = require('mongoose');
const schema = mongoose.Schema;

const AuthorSchema = new schema({
    first_name:{type:String,required:true,maxlength:100},
    family_name:{type:String,required:true,maxLength:100},
    date_of_birth:{type:Date},
    date_of_death:{type:Date}
});

AuthorSchema.virtual('name').get(function() {
                return `${this.family_name}, ${this.first_name}`;
            });
AuthorSchema.virtual('lifespan')
            .get(function() {
                return (this.date_of_death.getYear() - this.date_of_birth.getYear()).toString();
            });
AuthorSchema.virtual('url').get(function(){
                return '/catalog/author/' + this._id;
            });
AuthorSchema.virtual('date_birth_formatted')
            .get(function(){
                return this.date_of_birth ? DateTime.fromJSDate(this.date_of_birth).toLocaleString(DateTime.DATE_MED) : '';
            })
AuthorSchema.virtual('date_death_formatted')
            .get(function(){
                return this.date_of_death ? DateTime.fromJSDate(this.date_of_death).toLocaleString(DateTime.DATE_MED) : '';
            })
AuthorSchema.virtual('date_birth_AAAA_MM_DD')
            .get(function(){
                return this.date_of_birth ? DateTime.fromJSDate(this.date_of_birth).toFormat('yyyy-MM-dd') : '';
            })
AuthorSchema.virtual('date_death_AAAA_MM_DD')
            .get(function(){
                return this.date_of_death ? DateTime.fromJSDate(this.date_of_death).toFormat('yyyy-MM-dd') : '';
            })
module.exports = mongoose.model('Author',AuthorSchema);
