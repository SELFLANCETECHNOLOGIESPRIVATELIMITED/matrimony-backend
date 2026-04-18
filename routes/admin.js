const express = require("express");
const router = express.Router();
const adminDashController = require("../controller/dashboardController");
const dropdownController = require("../controller/dropdownController");
const { isAuthenticated } = require("../middlewares/auth");
const uploadFileController = require("../controller/uploadFileController");
const multer = require("multer");
const path = require("path");
//..............dashboard...............

const storage = multer.diskStorage({
  destination: "./temp", // Update the destination path
  filename: function (req, file, cb) {
    const extension = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, extension);
    cb(null, `${Date.now()}-${baseName}${extension}`);
  }
});

const upload = multer({ storage: storage });
router.get(
  "/admin/getAllUsers",
  isAuthenticated,
  adminDashController.getAllUsers
);
router.get(
  "/admin/dashDetails",
  isAuthenticated,
  adminDashController.dashDetails
);

router.post(
  "/admin/add-sub-plan",
  isAuthenticated,
  adminDashController.addSubscriptionPlan
);
router.get(
  "/admin/get-sub-plan",
  isAuthenticated,
  adminDashController.getSubscriptionPlan
);
router.delete(
  "/admin/deletePlan/:id",
  isAuthenticated,
  adminDashController.deleteSubscriptionPlan
);
router.put(
  "/admin/updatePlan/:id",
  isAuthenticated,
  adminDashController.updateSubscriptionPlan
);
router.get(
  "/admin/plan/:id",
  isAuthenticated,
  adminDashController.getSubscriptionPlanById
);
router.get("/admin/user/:id", isAuthenticated, adminDashController.getUserById);
router.put(
  "/admin/update-user/:id",
  isAuthenticated,
  adminDashController.updateUserMembership
);
router.put(
  "/admin/update-featured/:id",
  isAuthenticated,
  adminDashController.updateFeaturedStatus
);
router.put(
  "/admin/update-userActive/:id",
  isAuthenticated,
  adminDashController.updateActiveStatus
);
router.delete(
  "/admin/delete-user/:id",
  isAuthenticated,
  adminDashController.deleteUser
);
router.put(
  "/admin/change-user-password/:id",
  isAuthenticated,
  adminDashController.changeUserPasswordByAdmin
);

// admin auth
router.post("/admin/login", adminDashController.adminLogin);
router.get(
  "/admin/checkLogin",
  isAuthenticated,
  adminDashController.getUserInfo
);

router.get("/admin/logout", isAuthenticated, adminDashController.adminLogout);

router.get(
  "/admin/getUserInfo",
  isAuthenticated,
  adminDashController.getUserInfo
);

router.post(
  "/admin/uploadFile",
  upload.single("file"),
  uploadFileController.uploadFile
);

router.post("/admin/create-user", isAuthenticated, adminDashController.createUser);
router.put("/admin/edit-user/:id",isAuthenticated, adminDashController.editUser);
router.post("/admin/add-success-story",isAuthenticated , adminDashController.addSuccessStory);
router.get("/admin/get-success-stories",isAuthenticated, adminDashController.getSuccessStories);
router.delete("/admin/delete-success-story/:id",isAuthenticated , adminDashController.deleteSuccessStory);


// New Dropdown Options Endpoints
router.get('/admin/get-dropdown-options/:type', isAuthenticated, dropdownController.getOptionsByType);
router.post('/admin/add-dropdown-option', isAuthenticated, dropdownController.addOption);
router.put('/admin/update-dropdown-option/:id', isAuthenticated, dropdownController.updateOption);
router.delete('/admin/delete-dropdown-option/:id', isAuthenticated, dropdownController.deleteOption);

module.exports = router;
