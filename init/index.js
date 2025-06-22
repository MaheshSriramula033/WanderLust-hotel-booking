const mongoose=require("mongoose");
const initData=require("./data.js");
const Listing=require("../models/listing");

main()
.then(()=>{
    console.log("Connected to DB");
})
.catch((err)=>{
    console.log(err);
});
async function main() {
    await mongoose.connect("mongodb://127.0.0.1:27017/wanderlust");
}

const initDb = async () => {
   await Listing.insertMany(initData.data);
   initData.data=initData.data.map((obj) => (
     { ...obj, owner: "684a95fbceb33cd5bc769ec6" }
   ));
};
initDb();