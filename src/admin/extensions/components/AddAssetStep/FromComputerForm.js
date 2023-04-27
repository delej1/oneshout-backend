/* eslint-disable jsx-a11y/label-has-associated-control */
import React, { useRef, useState } from "react";
import PropTypes from "prop-types";
import styled from "styled-components";
import {
  Box,
  Flex,
  Typography,
  ModalFooter,
  Button,
  Icon,
} from "@strapi/design-system";
import { useTracking } from "@strapi/helper-plugin";
import { PicturePlus, PlusCircle } from "@strapi/icons";
import { useIntl } from "react-intl";
// import getTrad from "../../../utils/getTrad";
// import { rawFileToAsset } from "../../../utils/rawFileToAsset";
// import { AssetSource } from "../../../constants";
// const { rawFileToAsset } = require("@strapi/utils");
// const { AssetSource } = require("@strapi/constants");

const Wrapper = styled(Flex)`
  flex-direction: column;
`;

const IconWrapper = styled.div`
  font-size: ${60 / 16}rem;

  svg path {
    fill: ${({ theme }) => theme.colors.primary600};
  }
`;

const MediaBox = styled(Box)`
  border-style: dashed;
`;

const OpaqueBox = styled(Box)`
  opacity: 0;
  cursor: pointer;
`;

export const FromComputerForm = ({ onClose, onAddAssets, trackedLocation }) => {
  const { formatMessage } = useIntl();
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);
  const { trackUsage } = useTracking();

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const handleDragEnter = (event) => {
    event.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);

  const handleClick = (e) => {
    e.preventDefault();
    inputRef.current.click();
  };

  const AssetType = {
    Video: "video",
    Image: "image",
    Document: "doc",
    Audio: "audio",
  };

  const AssetSource = {
    Url: "url",
    Computer: "computer",
  };

  const typeFromMime = (mime) => {
    if (mime.includes(AssetType.Image)) {
      return AssetType.Image;
    }
    if (mime.includes(AssetType.Video)) {
      return AssetType.Video;
    }
    if (mime.includes(AssetType.Audio)) {
      return AssetType.Audio;
    }

    return AssetType.Document;
  };

  const rawFileToAsset = (rawFile, assetSource) => {
    return {
      size: rawFile.size / 1000,
      createdAt: new Date(rawFile.lastModified).toISOString(),
      name: rawFile.name,
      source: assetSource,
      type: typeFromMime(rawFile.type),
      url: URL.createObjectURL(rawFile),
      ext: rawFile.name.split(".").pop(),
      mime: rawFile.type,
      rawFile,
      isLocal: true,
    };
  };

  const handleChange = () => {
    const files = inputRef.current.files;
    const assets = [];

    for (let i = 0; i < files.length; i++) {
      const file = files.item(i);
      const asset = rawFileToAsset(file, AssetSource.Computer);

      assets.push(asset);
    }

    if (trackedLocation) {
      trackUsage("didSelectFile", {
        source: "computer",
        location: trackedLocation,
      });
    }

    onAddAssets(files[0]);
  };

  const handleDrop = (e) => {
    e.preventDefault();

    if (e?.dataTransfer?.files) {
      const files = e.dataTransfer.files;
      const assets = [];

      for (let i = 0; i < files.length; i++) {
        const file = files.item(i);
        const asset = rawFileToAsset(file, AssetSource.Computer);

        assets.push(asset);
      }
      // console.log(assets);
      onAddAssets(assets);
    }

    setDragOver(false);
  };

  return (
    <form>
      <Box paddingLeft={8} paddingRight={8} paddingTop={6} paddingBottom={6}>
        <label>
          <MediaBox
            paddingTop={11}
            paddingBottom={11}
            hasRadius
            justifyContent="center"
            borderColor={dragOver ? "primary500" : "neutral300"}
            background={dragOver ? "primary100" : "neutral100"}
            position="relative"
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <Flex justifyContent="center">
              <Wrapper>
                <Icon as={PlusCircle} width={"3rem"} height={"3rem"} />
                <Box paddingTop={3} paddingBottom={5}>
                  <Typography variant="delta" textColor="neutral600" as="span">
                    Drag & Drop here or
                  </Typography>
                </Box>

                <OpaqueBox
                  as="input"
                  position="absolute"
                  left={0}
                  right={0}
                  bottom={0}
                  top={0}
                  width="100%"
                  type="file"
                  // multiple
                  accept="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                  name="files"
                  tabIndex={-1}
                  ref={inputRef}
                  zIndex={1}
                  onChange={handleChange}
                />

                <Box position="relative">
                  <Button type="button" onClick={handleClick}>
                    Browse files
                  </Button>
                </Box>
                <Box paddingTop={3} paddingBottom={5}>
                  <Typography variant="sigma" textColor="warning600" as="span">
                    Excel (.xlsx) files only.
                  </Typography>
                </Box>
              </Wrapper>
            </Flex>
          </MediaBox>
        </label>
      </Box>
    </form>
  );
};

FromComputerForm.defaultProps = {
  trackedLocation: undefined,
};

FromComputerForm.propTypes = {
  onClose: PropTypes.func.isRequired,
  onAddAssets: PropTypes.func.isRequired,
  trackedLocation: PropTypes.string,
};
