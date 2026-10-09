const express = require("express")
const app = express();
const jwt = require("jsonwebtoken")
const { authMiddleware } = require("./middleware")
const{userModel ,organizationModel, boardsModel ,issueModel } = require("./models")

//middleware 
app.use(express.json());   
app.use(express.static(__dirname + "/public"));




app.post("/signup" ,  async function(req,res){

    const username = req.body.username 
    const password = req.body.password 

    const UserExist = await userModel.findOne({
        username:username
    })
    if (UserExist){
        res.status(403).json({
            message: "User with this username already exist"
        })
        return
    }

    const newUser = await  userModel.create({
        username: username,
        password : password 
    })

    res.json({
        id : newUser._id,
        message: "you have signed up succesfully"
    })
})



app.post("/signin" , async function(req,res){
    
    const username = req.body.username 
    const password = req.body.password 

    const UserExist =  await userModel.findOne({
        username: username,
        password : password 
    })


    if (!UserExist){
        res.status(403).json({
            message: "Incorrect login credentials"
        })
        return 
    }

    const token = jwt.sign(
        {userId: UserExist.id},
        "hariprasaad123"
    )

    res.json({token: token})



})


//for dashboard.html
app.get("/my-organization" , authMiddleware , async function(req,res){
    const userId = req.userId;

    const organizations = await organizationModel.find({

        $or : [

            {admin:userId},
            {members:userId} 
        ]

    })
    res.json({organizations: organizations})
})

//AUTHENITCATED ROUTE - MIDDLEWARE 
app.post("/onboarding", authMiddleware, async function(req,res){

    const userId =  req.userId;

  const newOrg = await   organizationModel.create({
        title : req.body.title, 
        description :req.body.description,
        admin : userId,
        members: []

    })


    res.json({
        message: "org created",
        id : newOrg._id
    })
})


app.get("/onboarding", authMiddleware , async  function(req,res){ //only admin can see the organization so that's why we are doing a check to find if the user logged into this page is admin 
    const userId = req.userId 
    const organizationId = req.query.organizationId;
    

    const organizations =  await  organizationModel.findOne({
        _id:organizationId })


    if (!organizations || organizations.admin.toString() != userId){
        res.status(403).json({
            message : "Either this org doesn't exist or you are not an admin of this org"
        })
        return 
    }


    const members  = await userModel.find({
        _id : organizations.members
    })



    res.json({
        organizations : {
            title : organizations.title,
            description : organizations.description,
            members : members.map(m=>({
                username: m.username,
                id : m._id

            }))
        }
    })


})




app.post("/add-member-to-organization" , authMiddleware , async  function(req,res){ //adding a member 

    const userId = req.userId 
    const organizationId = req.body.organizationId;
    const memberUserUsername = req.body.memberUserUsername

    const organizations =   await organizationModel.findOne({
        _id:organizationId })


    if (!organizations || organizations.admin.toString() != userId){
        res.status(403).json({
            message : "Either this org doesn't exist or you are not an admin of this org"
        })
        return 
    }

    const memberUser =   await userModel.findOne({
       username: memberUserUsername})


    if (!memberUser){
        res.status(403).json({
            message: "No user with this username exists in our db"
        })
        return
    }

   await organizationModel.updateOne({
    _id: organizationId
   }, {
    $push: {
        "members" : memberUser._id
    }
   })

    res.json({
        message: "New members added"
    })





})

    
app.delete("/remove-member-from-organization" , authMiddleware , async  function(req,res){ //removing a member from the org




    const userId = req.userId 
    const organizationId = req.body.organizationId;
    const memberUserUsername = req.body.memberUserUsername

    //find the org
    const organizations =   await organizationModel.findOne({
        _id:organizationId })

  //check if you are the admin 
    if (!organizations || organizations.admin.toString() != userId){
        res.status(403).json({
            message : "Either this org doesn't exist or you are not an admin of this org"
        })
        return 
    }

//search the user to remove them 
    const memberUser =   await userModel.findOne({
       username: memberUserUsername})


    if (!memberUser){
        res.status(403).json({
            message: "No user with this username exists in our db"
        })
        return
    }

 
    await organizationModel.updateOne({
        _id: organizationId

 } , {
    "$pull": {
        members : memberUser._id
    }
 })

 res.json({
    message: "member removed"
 })



})

    

app.post("/board" , authMiddleware , async function(req,res){//creating a board

    const userId = req.userId;
    const organizationId = req.body.organizationId;
    


    const organizations = await organizationModel.findOne({
        _id : organizationId
    })


    if (!organizations){
        res.status(403).json({
            message:"This org doesn't exist in our database "
        })
        return
    }
    const members = organizations.members.map(m=>m.toString())


    if  (organizations.admin.toString()!= userId && !members.includes(userId) ){
        res.status(403).json({
            message: " you don't have access to this org"
        })

        return 
    }


    const newBoard = await boardsModel.create({
        board : req.body.board,
        organizationId : organizationId


    })



    res.json({
        message: "new board created",
        id: newBoard._id

    })




})



app.get("/board" , authMiddleware , async function(req,res){

    const userId = req.userId
    const organizationId = req.query.organizationId;
    const organizations = await organizationModel.findOne({

      _id : organizationId  
    })


    if (!organizations){
        res.status(403).json({
            message: "This org doesn't exist"
        })
        return 
    }

    const members =  organizations.members.map(m=>m.toString());
    
    if (organizations.admin.toString() != userId && !members.includes(userId)){
        res.status(403).json({
            message: "you are neither admin or member of this org"
        })

        return 
    }


    const boards = await boardsModel.find({
        organizationId : organizationId

    })


    res.json({
        boards : boards
    })


})






app.post("/issues" , authMiddleware, async function(req,res){


    //who is asking and which board ?
    const userId = req.userId;
    const boardId = req.body.boardId;

    const boards = await boardsModel.findOne({
        _id: boardId
    })

   //2. does the board exist ?
    if (!boards){
        res.status(403).json({
            message:"Board doesn't exist check again !"

        })
        return 
    }

    //3. which org owns the board ? ask the board not the user
    const organizations = await organizationModel.findOne({

        _id : boards.organizationId  
      })
  
  
      if (!organizations){
          res.status(403).json({
              message: "This org doesn't exist"
          })
          return 
      }

  //4. Is the user member or admin  of that org ?
      const members =  organizations.members.map(m=>m.toString());
    
    if (organizations.admin.toString() != userId && !members.includes(userId)){
        res.status(403).json({
            message: "you are neither admin or member of this org"
        })

        return 
    }

//5 create new issue; new cards always start with what's next 
    const newIssue = await issueModel.create({

        title: req.body.title,
         status : "up next",
         boardId: boardId
    })



//send back the new issue id 
    res.json({
        id : newIssue._id,
        message: "new Issue successfully created"
    })//which org owns the board 


})



app.get("/issues", authMiddleware , async function(req,res){

    const userId = req.userId;
    const boardId = req.query.boardId;

// does board exist 
    const boards = await boardsModel.findOne({
        _id: boardId
    })

    if (!boards){
        res.status(403).json({
            message: "board doesnt exist"
        })
        return 
    }


const organizations = await organizationModel.findOne({
    _id: boards.organizationId
})

if (!organizations){
    res.status(403).json({
        message: "org doesn't exist "
    })
    return 
}


//check if the request is from admin and  members 

const members =  organizations.members.map(m=>m.toString());

if (organizations.admin.toString() != userId && !members.includes(userId)){
    res.status(403).json({
        message: "you are neither member or admin of this org"
    })
    return 

}


const issues = await issueModel.find({

    boardId: boardId
})


res.json({
    issues : issues
})






})


app.put("/issues" , authMiddleware , async function(req,res){

    const userId = req.userId;
    const issueId = req.body.issueId

    const issue = await issueModel.findOne({
        _id :  issueId
    })

    if (!issue){
        res.status(403).json({
            message: "issue doesn't exist"
        })
        return 
    }

    const boards  = await boardsModel.findOne({
        _id: issue.boardId
    })

    if (!boards){
        res.status(403).json({
            message: "board doesnt exist"
        })
        return 
    }

    const organizations = await organizationModel.findOne({
        _id: boards.organizationId
    })


    if (!organizations){
        res.status(403).json({
            message: "This org doesn't exist "
        })
        return 
    }


    const members = organizations.members.map(m=>m.toString());
    
    if (organizations.admin.toString()!=userId && !members.includes(userId)) {
        res.status(403).json({
            message: "you are neither member or admin of this org"
        })
        return
    }



    let nextStatus;
    
    
    if (issue.status==="up next"){
        nextStatus = "in progress"
    } else if (issue.status ==="in progress"){

        nextStatus = "done"
    } else {

        res.status(400).json({
            message : "Issue is already done"
        })

        return 
    }


    await issueModel.updateOne({
        _id: issueId
    }, {
        $set : {status: nextStatus}
    })


    res.json({message: "issue moved",
        status: nextStatus
    })


})







app.listen(3008)