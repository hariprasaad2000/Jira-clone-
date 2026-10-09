const mongoose = require("mongoose")
mongoose.connect("mongodb://localhost:27017/Trello")

const UserSchema = new mongoose.Schema({
    username: String,
    password: String 
})


const OrganizationSchema = new mongoose.Schema({
    title: String , 
    description: String,
    admin: mongoose.Types.ObjectId,
    members : [mongoose.Types.ObjectId]

})


const BoardsSchema =new mongoose.Schema({
    board : String,
    organizationId : mongoose.Types.ObjectId
})


const IssueSchema = new mongoose.Schema({
    title : String,
    boardId : mongoose.Types.ObjectId,
    status : String

})

const userModel = mongoose.model("users" ,  UserSchema)
const  organizationModel = mongoose.model("organization", OrganizationSchema)
const boardsModel = mongoose.model("boards" , BoardsSchema)
const issueModel = mongoose.model("issue" , IssueSchema)


module.exports = {
    organizationModel,
    userModel,
    boardsModel,
    issueModel

}