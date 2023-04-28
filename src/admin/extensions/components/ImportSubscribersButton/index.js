import React, { useState } from "react";
import { Button } from "@strapi/design-system/Button";
import File from "@strapi/icons/File";

import { useCMEditViewDataManager, request } from "@strapi/helper-plugin";
import {
  ModalLayout,
  ModalBody,
  ModalHeader,
  ModalFooter,
  Typography,
  Loader,
  Box,
  Status,
  Badge,
  Flex,
  Dialog,
  DialogBody,
  DialogFooter,
} from "@strapi/design-system";
import { ExclamationMarkCircle, Trash, CheckCircle } from "@strapi/icons";
import { FromComputerForm } from "../AddAssetStep/FromComputerForm";
const readXlsxFile = require("read-excel-file");
import parsePhoneNumber from "libphonenumber-js";
import { parsePhoneNumberWithError, ParseError } from "libphonenumber-js";

import pluginId from "/src/plugins/oneshout/admin/src/pluginId";
// const MyCompo = () => {
//   const {
//     createActionAllowedFields: [], // Array of fields that the user is allowed to edit
//     formErrors: {}, // Object errors
//     readActionAllowedFields: [], // Array of field that the user is allowed to edit
//     slug:"api::address.address", // Slug of the content-type
//     updateActionAllowedFields: [],
//     allLayoutData: {
//       components: {}, // components layout
//       contentType: {}, // content-type layout
//     },
//     initialData: {},
//     isCreatingEntry: true,
//     isSingleType: true,
//     status: 'resolved',
//     layout: {}, // Current content-type layout
//     hasDraftAndPublish: true,
//     modifiedData: {},
//     onPublish: () => {},
//     onUnpublish: () => {},
//     addComponentToDynamicZone: () => {},
//     addNonRepeatableComponentToField: () => {},
//     addRelation: () => {},
//     addRepeatableComponentToField: () => {},
//     moveComponentDown: () => {},
//     moveComponentField: () => {},
//     moveComponentUp: () => {},
//     moveRelation: () => {},
//     onChange: () => {},
//     onRemoveRelation: () => {},
//     removeComponentFromDynamicZone: () => {},
//     removeComponentFromField: () => {},
//     removeRepeatableField: () => {},
//   } = useCMEditViewDataManager()

//   return null
// }

const ImportSubscribersButton = () => {
  const { slug, initialData } = useCMEditViewDataManager();
  const [isVisible, setIsVisible] = useState(false);
  const [isErrorVisible, setIsErrorVisible] = useState(false);
  const [isDialogVisible, setIsDialogVisible] = useState(false);
  const [uploadErrors, setUploadErrors] = useState([]);
  const [uploadResults, setUploadResults] = useState([]);

  // console.log(useCMEditViewDataManager());
  function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  //   const validateEmail = (input) => {
  //     var validRegex =
  //       /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
  // const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  // const email = "example@email.com";

  // if (emailRegex.test(email)) {
  //   console.log("Valid email address");
  // } else {
  //   console.log("Invalid email address");
  // }

  //     if (input.match(validRegex)) {
  //       alert(input);
  //       return true;
  //     } else {
  //       return false;
  //     }
  //   };
  const onAddAssets = (file) => {
    setIsVisible(false);
    const schema = {
      "First Name": { prop: "firstname", type: String, required: true },
      "Last Name": { prop: "lastname", type: String, required: true },
      Phone: {
        prop: "phone",
        type: (value) => {
          try {
            const number = parsePhoneNumberWithError(value);
            return number.number;
          } catch (error) {
            if (error instanceof ParseError) {
              // Not a phone number, non-existent country, etc.
              console.log(error.message);
              throw new Error(error.message);
            } else {
              throw error;
            }
          }
        },
        required: true,
      },
      Email: {
        prop: "email",
        type: (value) => {
          const email = validateEmail(value);
          if (!email) {
            throw new Error("Invalid Email Address");
          }
          return value;
        },
        required: false,
      },
    };

    readXlsxFile(file, { schema }).then(async ({ rows, errors }) => {
      console.log(errors);
      if (errors.length > 0) {
        setIsErrorVisible(true);
        setUploadErrors(errors);
      } else {
        try {
          const response = await request(
            `/oneshout/subscriptions/import-subscribers`,
            {
              method: "POST",
              body: { data: rows, subscription: initialData },
            }
          );
          console.log(response);
          setUploadResults(response);
          setIsDialogVisible(true);
        } catch (error) {
          console.log(error);
        }
      }
    });
  };

  return (
    <>
      {slug == "api::v1.subscription" ? (
        <Button
          variant="secondary"
          startIcon={<File />}
          onClick={() => setIsVisible((prev) => !prev)}
        >
          Import Subscribers
        </Button>
      ) : (
        <></>
      )}
      {isErrorVisible && (
        <ModalLayout
          onClose={() => setIsErrorVisible((prev) => !prev)}
          labelledBy="title"
        >
          <ModalHeader>
            <Typography
              fontWeight="bold"
              textColor="neutral800"
              as="h2"
              id="title"
            >
              Invalid Document Upload
            </Typography>
          </ModalHeader>
          <ModalBody>
            <Status variant="danger" showBullet={false}>
              <Typography>
                The file you uploaded is not valid. Please correct the errors
                below and upload again.
              </Typography>
            </Status>

            <Box paddingTop={3} paddingBottom={5}>
              <Typography>There are {uploadErrors.length} error(s)</Typography>
            </Box>
            <Box paddingTop={3} paddingBottom={5}>
              {uploadErrors.map((err, i) => (
                <Flex direction="column" alignItems="left" gap={2}>
                  <Flex gap={1}>
                    <li>
                      {" "}
                      <Typography>
                        {" "}
                        {err.error} ({err.value}) -{" "}
                      </Typography>
                      <Badge size="S">
                        {" "}
                        Row: {err.row} | Column: {err.column}
                      </Badge>
                    </li>
                  </Flex>
                </Flex>
              ))}
            </Box>
          </ModalBody>
          <ModalFooter
            startActions={<></>}
            endActions={
              <>
                {" "}
                <Button
                  onClick={() => setIsErrorVisible((prev) => !prev)}
                  variant="tertiary"
                >
                  Cancel
                </Button>
                {/* <Button variant="secondary">Add new stuff</Button>
                <Button onClick={() => setIsVisible((prev) => !prev)}>
                  Finish
                </Button> */}
              </>
            }
          />
        </ModalLayout>
      )}
      {isVisible && (
        <ModalLayout
          onClose={() => setIsVisible((prev) => !prev)}
          labelledBy="title"
        >
          <ModalHeader>
            <Typography
              fontWeight="bold"
              textColor="neutral800"
              as="h2"
              id="title"
            >
              Import Subscribers
            </Typography>
          </ModalHeader>
          <ModalBody>
            <FromComputerForm onAddAssets={onAddAssets} onClose={() => {}} />
          </ModalBody>
          <ModalFooter
            startActions={<></>}
            endActions={
              <>
                {" "}
                <Button
                  onClick={() => setIsVisible((prev) => !prev)}
                  variant="tertiary"
                >
                  Cancel
                </Button>
                {/* <Button variant="secondary">Add new stuff</Button>
                <Button onClick={() => setIsVisible((prev) => !prev)}>
                  Finish
                </Button> */}
              </>
            }
          />
        </ModalLayout>
      )}
      <Dialog
        onClose={() => setIsDialogVisible(false)}
        title="Subscriber Upload"
        isOpen={isDialogVisible}
      >
        <DialogBody icon={<CheckCircle color="default" />}>
          <Flex direction="column" alignItems="center" gap={2}>
            <Flex justifyContent="center">
              <Typography id="confirm-description">
                Newly added subscribers: {uploadResults.addedCount}
              </Typography>
            </Flex>
            <Flex justifyContent="center">
              <Typography id="confirm-description">
                Duplicate subscribers: {uploadResults.existsCount}
              </Typography>
            </Flex>
          </Flex>
        </DialogBody>
        <DialogFooter
          startAction={
            <></>
            // <Button
            //   onClick={() => setIsDialogVisible(false)}
            //   variant="tertiary"
            // >
            //   Cancel
            // </Button>
          }
          endAction={
            <Flex
              direction="row"
              alignItems="center"
              justifyContent="center"
              gap={2}
            >
              <Button
                onClick={() => {
                  window.location.reload();
                  setIsDialogVisible(false);
                }}
                variant="default"
              >
                Ok
              </Button>
            </Flex>
          }
        />
      </Dialog>
    </>
  );
};

export default ImportSubscribersButton;
