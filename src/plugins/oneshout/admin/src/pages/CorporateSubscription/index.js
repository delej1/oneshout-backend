/*
 *
 * CorporateSubscription
 *
 */

import React, { memo } from "react";
// import PropTypes from 'prop-types';
import pluginId from "../../pluginId";
import { Box } from "@strapi/design-system/Box";
import { Layout } from "@strapi/design-system/Layout";
import { Button } from "@strapi/design-system/Button";
import {
  SubNav,
  SubNavHeader,
  SubNavSections,
  SubNavLink,
  SubNavLinkSection,
  SubNavSection,
  HeaderLayout,
  ActionLayout,
  Tag,
  ContentLayout,
  Table,
  TFooter,
  Thead,
  Tbody,
  Th,
  Tr,
  Td,
  BaseCheckbox,
  Typography,
  VisuallyHidden,
  Avatar,
  Flex,
  IconButton,
} from "@strapi/design-system";
import { ExclamationMarkCircle } from "@strapi/icons/ExclamationMarkCircle";
import Plus from "@strapi/icons/Plus";
import Pencil from "@strapi/icons/Pencil";
import Trash from "@strapi/icons/Trash";
import Refresh from "@strapi/icons/Refresh";
import Dashboard from "@strapi/icons/Dashboard";
import { DatePicker } from "@strapi/design-system/DatePicker";
import {
  Card,
  CardHeader,
  CardBody,
  CardCheckbox,
  CardAction,
  CardAsset,
  CardTimer,
  CardContent,
  CardBadge,
  CardTitle,
  CardSubtitle,
} from "@strapi/design-system/Card";

import { GridLayout } from "@strapi/design-system/Layout";
import { Divider } from "@strapi/design-system/Divider";
import { useEffect } from "react";
const CorporateSubscription = () => {
  const reports = [
    {
      id: 1,
      label: "Corporate Subscription",
      icon: <ExclamationMarkCircle />,
      to: `/plugin/${pluginId}/corporate-subscription`,
    },
  ];

  return (
    <Box background="neutral100">
      <Layout
        sideNav={
          <SubNav ariaLabel="Builder sub nav">
            <SubNavHeader
              searchable
              value={""}
              onClear={() => {}}
              onChange={() => {}}
              label="One Shout "
              // searchLabel="Search..."
            />
            <SubNavSections>
              <SubNavLink icon={<Dashboard />} to="/" key="key_dashboard">
                Dashboard
              </SubNavLink>

              <SubNavSection collapsable label="Subscriptions">
                {reports.map((link) => (
                  <SubNavLink icon={<Dashboard />} to={link.to} key={link.id}>
                    {link.label}
                  </SubNavLink>
                ))}
              </SubNavSection>
            </SubNavSections>
          </SubNav>
        }
      >
        <>
          <HeaderLayout
            // primaryAction={<Button startIcon={<Plus />}>Add an entry</Button>}
            secondaryAction={
              // <Button variant="tertiary" startIcon={<Refresh />}></Button>
              <IconButton
                onClick={() => console.log("reload dash")}
                icon={<Refresh />}
              />
            }
            title="Corporate Subscription"
            subtitle="..."
            as="h2"
          />
          <Box padding={8}>
            <GridLayout>
              <Box
                padding={4}
                hasRadius
                background="neutral0"
                key={`box-1`}
                shadow="tableShadow"
              >
                <Typography variant="alpha">23</Typography>
                <Divider unsetMargin={false} />
                <Typography textColor="neutral500">Hosts</Typography>
              </Box>
              <Box
                padding={4}
                hasRadius
                background="neutral0"
                key={`box-1`}
                shadow="tableShadow"
              >
                <Typography variant="alpha">23</Typography>
                <Divider unsetMargin={false} />
                <Typography textColor="neutral500">Guests</Typography>
              </Box>
            </GridLayout>
          </Box>
        </>
      </Layout>
    </Box>
  );
};

export default memo(CorporateSubscription);
