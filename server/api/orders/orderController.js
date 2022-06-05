const Order = require("./orderModel");
const path = require("path");
const fs = require("fs");
const JSZip = require("jszip");

exports.createOrder = async (req, res) => {
  try {
    const {
      designFormat,
      orderMode,
      orderStatus,
      orderHistory,
      link,
      createdBy,
      modifiedBy,
      isDeleted,
      deletedAt,
      deletedBy,
    } = req.body;
    const zip = new JSZip();
    const files = req.files.file;

    if (files.length) {
      let zipFilePath =
        path.join(__dirname, "../../../", "public") + "/" + `orderFiles` + ".zip";
      const fileUrl_dataFillZip =
        req.protocol +
        "://" +
        req.get("host") +
        zipFilePath.split(path.join(__dirname, "../../../", "public")).pop();
      const storedFiles = [];
      const saveFile = new Promise((resolve, reject) => {
        files.map((file) => {
          const randomName = crypto
            .createHash("sha1")
            .update(seed)
            .digest("hex");
          const expension = file.name.split(/[\s.]+/).pop();
          const filePath = path.join(
            __dirname,
            "../../../",
            "public",
            `File_${randomName}.${expension}`
          );

          file.mv(filePath, function (err) {
            if (err) reject("Error");
            console.log("******************* File Saved *******************");
          });

          storedFiles.push({
            path: filePath,
            name: `File_${randomName}.${expension}`,
          });
        });
        resolve("Resolved");
      });
      saveFile
        .then((data) => {
          console.log(data);
          storedFiles.map((storedFile) => {
            zip.file(storedFile.name, fs.readFileSync(storedFile.path));
          });

          zip
            .generateNodeStream({
              type: "nodebuffer",
              streamFiles: true,
            })
            .pipe(fs.createWriteStream(zipFilePath))
            .on("finish", function () {
              // JSZip generates a readable stream with a "end" event,
              // but is piped here in a writable stream which emits a "finish" event.

              const order = new Order({
                $inc: { orderNumber: 1 },
                designFormat,
                orderMode,
                orderStatus,
                orderHistory,
                uploadFileUrl : fileUrl_dataFillZip,
                link,
                createdBy,
                modifiedBy,
                isDeleted,
                deletedAt,
                deletedBy,
              });
              await order.save();
              res.status(200).send({
                status: "Ok",
                message: "record created successfully",
              });
            });
        })
        .catch((err) => {
          console.log(
            "*******************Error Check Server Logs*******************"
          );
          console.log(err);
        });
    }
  } catch (err) {
    console.log("Error :", err);
    res.status(400).send({ status: "Error", message: "check server logs" });
  }
};

exports.getAllOrders = async (req, res) => {
  try {
    let findQuery = { isDeleted: false };
    let top = 10;
    let skip = 0;
    let populate = "";
    let sort = "";

    if (req.query.name) {
      let regex = new RegExp(req.query.name);
      findQuery.name = { $regex: regex };
    }
    if (req.query.populate) {
      populate = req.query.populate;
    }

    if (req.query.top) {
      top = parseInt(req.query.top);
    }
    if (req.query.skip) {
      skip = parseInt(req.query.skip);
    }

    if (req.query.sort) {
      sort = req.query.sort;
    }
    let totalCount = await Order.countDocuments({ ...findQuery });
    const order = await Order.find({ ...findQuery })
      .populate(populate)
      .skip(skip)
      .limit(top)
      .sort(sort);

    res.status(200).send({
      status: "Ok",
      data: order,
      count: totalCount,
    });
  } catch (err) {
    console.log("Error :", err);
    res.status(400).send({ status: "Error", message: "check server logs" });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const Order = await Order.findById({ _id: id });
    res.status(200).send({ status: "Ok", data: Order });
  } catch (err) {
    console.log("Error :", err);
    res.status(400).send({ status: "Error", message: "check server logs" });
  }
};

exports.updateOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const { designFormat, orderMode, orderStatus } = req.body;
    const userId = req.user._id;
    await Order.findOneAndUpdate(
      { _id: id },
      { designFormat, orderMode, orderStatus, modifiedBy: userId }
    );
    res
      .status(200)
      .send({ status: "Ok", message: "record updated successfully" });
  } catch (err) {
    console.log("Error :", err);
    res.status(400).send({ status: "Error", message: "check server logs" });
  }
};

exports.deleteOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const date = new Date();
    const userId = req.user._id;
    await Order.findOneAndUpdate(
      { _id: id },
      { isDeleted: true, deletedAt: date, deletedBy: userId }
    );
    res
      .status(200)
      .send({ status: "Ok", message: "record updated successfully" });
  } catch (err) {
    console.log("Error :", err);
    res.status(400).send({ status: "Error", message: "check server logs" });
  }
};
