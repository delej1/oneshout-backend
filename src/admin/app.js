import ImportSubscribersButton from "./extensions/components/ImportSubscribersButton";

export default {
  bootstrap(app) {
    app.injectContentManagerComponent("editView", "right-links", {
      name: "ImportSubscribersButton",
      Component: ImportSubscribersButton,
    });
  },
};
