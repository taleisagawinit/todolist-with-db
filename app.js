//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

// set up express
const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));


// set up mongoose

mongoose.connect("mongodb+srv://admin-talei:"  + process.env.MONGO_PASS + "@cluster0-wtw9j.mongodb.net/todolistDB?retryWrites=true&w=majority", { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false });

const itemsSchema = {
  name: {
    type: String,
    require: true
  }
};

const Item = mongoose.model("item", itemsSchema);

const item1 = new Item({
  name: "Welcome to your todolist! ✨"
})

const item2 = new Item({
  name: "Hit the ➕ button to add a new item"
})

const item3 = new Item({
  name: "⬅ Hit this to delete an item"
})

const defaultItems = [item1, item2, item3];

const customListSchema = {
  name: String,
  items: [itemsSchema]
}

const List = mongoose.model("list", customListSchema);



app.get("/", function(req, res) {
  // get items in db
  Item.find({}, function(err, result) {
    if (err) {
      console.log(err)
    } 
    // if there's no items, add the default items
    else if (result.length === 0) {
      Item.insertMany([item1, item2, item3], function(err) {
        if (err) {
          console.log(err);
        } 
      })
      res.redirect("/");
    } 
    // if there are items already, display them
    else {
      res.render("list", {listTitle: "Today", newListItems: result});
    }
  })
  

});



app.post("/", function(req, res){
  let insertItem = Item({
    name: req.body.newItem
  })
  let listName = req.body.list;

  if (listName === "Today") {
    insertItem.save();
    res.redirect("/");
  } else {
    List.findOne({name: listName}, function(err, result) {
      if (err) {
        console.log(err);
      } else {
        result.items.push(insertItem);
        result.save();
        res.redirect("/" + listName)
      }
    })
  }
});


app.post("/delete", function(req, res) {
  let id = req.body.checkbox;
  let listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(id, function(err) {
      if (err) {
        console.log(err) 
      } else {
        res.redirect("/");
      }
    })
  } else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: id}}}, function(err) {
      if (err) {
        console.log(err)
      } else {
        "Successsfully updated."
        res.redirect("/" + listName);
      }
    })
  }
  

})



app.get("/:list", function(req, res) {
  let title = _.capitalize(req.params.list);

  List.findOne({name: title}, function(err, result) {
    if (err) {
      console.log('ERROR', err)
    } else if (result) {
      // this means the list does exist
      res.render("list", {listTitle: result.name, newListItems: result.items})
    } else {
      // this means the custom list does not exist yet
      const customList = new List({
        name: title,
        items: defaultItems
      })
    
      customList.save();
      res.redirect("/" + title)
    }
  })
  
})


app.listen(3000 || process.env.PORT, function() {
  console.log("Server started successfully");
});

