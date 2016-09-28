---
title: Active Directory
layout: docs
weight: 60
---

Environment Manager uses Active Directory to authenticate users and to read group membership to assign permissions within the tool.

The setup of Active Directory is pretty simple:

- Create a service account 
    - This will be used by Environment Manager to query the domain controller and seek permission to authenticate users. It does not require any specific permissions other than to be a member of the correct domain.
    - Make a note of the name/password as it will need to be added to the Environment Manager configuration file during the application install
- Create a group for Environment Manager admins
    - This should be called “EM Admins” (can be changed later)
    - Add yourself and any other users who should have full admin permissions to this group

Other AD groups can be created and assigned specific permissions within EM later through the Configuration section of the website. See [Link: EM PERMISSIONS GUIDE].
