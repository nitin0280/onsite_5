//jshint esversion:6
const express=require("express");
const bodyParser=require("body-parser");
const ejs=require("ejs");
const app=express();
const https = require('https');
const requ=require('request');

app.use(express.static("public"));
app.set('view engine','ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));
var done=false;
var artist_array=[];
app.listen(3000,function()
{
  console.log("server started");
});
var request = require('request'); // "Request" library

var client_id = '78bc38bdfce6403d8aa5563cc1b5c8c8'; // Your client id
var client_secret = '1275e03211fb4653b20d2b66f3a6d23c'; // Your secret
var authOptions = {
  url: 'https://accounts.spotify.com/api/token',
  headers: {
    'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
  },
  form: {
    grant_type: 'client_credentials'
  },
  json: true
};
var ans=-1;
var temp=[];
var name=new Map();
var visited=new Set();
var map=new Map();
function artistList(art1id,token)
{
  return new Promise((resolve,reject)=>{
    temp=[];
    var options = {
      url: 'https://api.spotify.com/v1/artists/'+art1id+'/related-artists',
      headers: {
        'Authorization': 'Bearer ' + token
      },
      json: true
    };
    request.get(options, function(error, response, body)  {
      if(!error && response.statusCode==200)
      {
        var artists=response.body.artists;
        artists.forEach((artist, i) => {
          temp.push(artist.id);
          name.set((artist.id).toString(),artist.name);
          resolve();
        });
      }
      else
      {
           reject("list function goes wrond");
      }
    });
  });
}
var id;
function getID(artistname,token)
{
  return new Promise((resolve,reject)=>{
  var options = {
    url: 'https://api.spotify.com/v1/search?q='+artistname+'&type=artist&offset=0&limit=1',
    headers: {
      'Authorization': 'Bearer ' + token
    },
    json: true
  };
  request.get(options, function(error, resp, body) {
    if(!error && resp.statusCode==200)
    {
      id=resp.body.artists.items[0].id;
      name.set(id.toString(),(resp.body.artists.items[0].name));
      resolve();
    }
    else{
      reject("Id function goes wornd");
    }
});
});
}
async function find_ans(token,art1,art2,callback)
{
  await getID(art1,token);
  var id1=id;
  await getID(art2,token);
  var id2=id;
  console.log(id1,id2);
  var arr=[];
  arr.push(id1);
  visited.add(id1);
  var ans=Infinity;
  var cnt=0;
  console.log("searching in layer 0");
  if(id1==id2)
  {
    ans=0;
    console.log("match found");
  }
  for(;ans==Infinity;)
  {
    console.log("layer"+cnt);
    console.log(arr.length);
    console.log(visited.size);
    var arrtemp=[];
    for(var i=0;i<arr.length && ans==Infinity;i++){
      console.log("searching in layer"+(cnt+1));
      await artistList(arr[i],token)
      temp.forEach((item)=>{
        if(item==id2)
        {
          map.set(item.toString(),arr[i].toString());
          console.log("match found");
          ans=cnt;
        }
        else{
          if(!visited.has(item))
          {
            map.set(item.toString(),arr[i].toString());
            arrtemp.push(item);
            visited.add(item);
          }
        }
      });
    }
    arr=arrtemp;
    cnt++;
  }
  console.log("answer is"+(ans));
callback(cnt,id1,id2);
}
app.get("/",function(req,res)
{
  res.sendFile(__dirname+"/index.html");
});
app.post("/",function(req,res)
{
  temp=[];
  visited.clear();
  ans=-1;
  done=false;
  artist_array=[];
  map.clear();
  var art1=req.body.art1;
  var art2=req.body.art2;
  requ.post(authOptions, function(error, response, body) {
    if (!error && response.statusCode === 200) {
      var token = body.access_token;
      find_ans(token,art1,art2,function(ans,id1,id2)
    {
      console.log(ans);
      if(ans!=-1)
      {
        var path=[];
        var start=id2.toString();
        path.push(name.get(start.toString()));
        while(start!=id1)
        {
          console.log(name.get(start.toString()));
          start=map.get(start);
          path.push(name.get(start.toString()));
        }
        path.reverse();
        res.render("ans",{
          art1:art1,
          art2:art2,
          ans:ans,
          path:path
        });
      }
      else{
        res.render("404");
      }
    });
  }});
});
