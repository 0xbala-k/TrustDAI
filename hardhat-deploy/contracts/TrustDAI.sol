// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract TrustDAI {
    // Mapping from user to array of file CIDs they own
    mapping(address => string[]) private userFiles;

    // Mapping from file CID to file owner
    mapping(string => address) public fileOwner;

    // Mapping from file CID to mapping of addresses that have access
    mapping(string => mapping(address => bool)) private fileAccess;

    // Mapping from file CID to array of addresses that have access (for iteration)
    mapping(string => address[]) private fileAccessList;

    // Events to log operations
    event FileAdded(address indexed owner, string cid);
    event FileDeleted(address indexed owner, string cid);
    event AccessGranted(
        address indexed owner,
        string cid,
        address indexed grantee
    );
    event AccessRevoked(
        address indexed owner,
        string cid,
        address indexed revoked
    );
    event FileUpdated(address indexed owner, string oldCid, string newCid);

    // Modifier to restrict actions to the file owner only
    modifier onlyFileOwner(string memory cid) {
        require(
            fileOwner[cid] == msg.sender,
            "Only file owner can perform this action."
        );
        _;
    }

    /// @notice Add a new file. Only the file owner is added to the access list.
    /// @param cid The IPFS CID of the file.
    function addFile(string memory cid) public {
        require(fileOwner[cid] == address(0), "File already exists");

        // Set the file owner and record the file in the owner's list.
        fileOwner[cid] = msg.sender;
        userFiles[msg.sender].push(cid);

        // Grant access to the owner by default.
        fileAccess[cid][msg.sender] = true;
        fileAccessList[cid].push(msg.sender);

        emit FileAdded(msg.sender, cid);
    }

    /// @notice Grant access to a file for a specific address.
    /// @param cid The IPFS CID of the file.
    /// @param user The address to grant access.
    function grantAccess(
        string memory cid,
        address user
    ) public onlyFileOwner(cid) {
        if (!fileAccess[cid][user]) {
            fileAccess[cid][user] = true;
            fileAccessList[cid].push(user);
            emit AccessGranted(msg.sender, cid, user);
        }
    }

    /// @notice Revoke access to a file from a specific address.
    /// @param cid The IPFS CID of the file.
    /// @param user The address to revoke access from.
    function revokeAccess(
        string memory cid,
        address user
    ) public onlyFileOwner(cid) {
        require(fileAccess[cid][user], "User does not have access");
        // Prevent the owner from being revoked.
        require(user != msg.sender, "Owner cannot be revoked");
        fileAccess[cid][user] = false;
        _removeAddressFromList(fileAccessList[cid], user);
        emit AccessRevoked(msg.sender, cid, user);
    }

    /// @notice Check if the caller has access to a file.
    /// @param cid The IPFS CID of the file.
    /// @return True if the caller has access; otherwise, false.
    function hasAccess(string memory cid) public view returns (bool) {
        require(fileOwner[cid] != address(0), "File doesn't exist.");
        return fileAccess[cid][msg.sender] || fileOwner[cid] == msg.sender;
    }

    /// @notice Delete a file (only the file owner can call this).
    /// @param cid The IPFS CID of the file.
    function deleteFile(string memory cid) public onlyFileOwner(cid) {
        // Remove the file from the owner's list.
        string[] storage files = userFiles[msg.sender];
        for (uint i = 0; i < files.length; i++) {
            if (keccak256(bytes(files[i])) == keccak256(bytes(cid))) {
                files[i] = files[files.length - 1];
                files.pop();
                break;
            }
        }
        // Delete the file ownership and its access list.
        delete fileOwner[cid];
        delete fileAccessList[cid];
        // Note: The inner mapping fileAccess[cid] is not explicitly deleted but becomes unreachable.
        emit FileDeleted(msg.sender, cid);
    }

    /// @notice Update a file's CID while retaining its access list (only the file owner can call this).
    /// @param oldCid The current IPFS CID of the file.
    /// @param newCid The new IPFS CID for the file.
    function updateFile(
        string memory oldCid,
        string memory newCid
    ) public onlyFileOwner(oldCid) {
        require(fileOwner[newCid] == address(0), "New CID already exists");

        // Update the file ownership mapping.
        fileOwner[newCid] = msg.sender;
        delete fileOwner[oldCid];

        // Copy the access list from the old CID to the new one.
        address[] memory accessList = fileAccessList[oldCid];
        for (uint i = 0; i < accessList.length; i++) {
            fileAccess[newCid][accessList[i]] = true;
        }
        fileAccessList[newCid] = accessList;
        delete fileAccessList[oldCid];

        // Update the file reference in the owner's file list.
        string[] storage files = userFiles[msg.sender];
        for (uint i = 0; i < files.length; i++) {
            if (keccak256(bytes(files[i])) == keccak256(bytes(oldCid))) {
                files[i] = newCid;
                break;
            }
        }
        emit FileUpdated(msg.sender, oldCid, newCid);
    }

    /// @notice Retrieve the list of files owned by a user.
    /// @param user The user's address.
    /// @return An array of file CIDs.
    function getUserFiles(address user) public view returns (string[] memory) {
        return userFiles[user];
    }

    /// @notice Retrieve the access list for a file.
    /// @param cid The IPFS CID of the file.
    /// @return An array of addresses that have access to the file.
    function getAccessList(
        string memory cid
    ) public view returns (address[] memory) {
        return fileAccessList[cid];
    }

    /// @dev Internal helper function to remove an address from an array.
    /// @param list The storage array from which to remove the address.
    /// @param user The address to remove.
    function _removeAddressFromList(
        address[] storage list,
        address user
    ) internal {
        for (uint i = 0; i < list.length; i++) {
            if (list[i] == user) {
                list[i] = list[list.length - 1];
                list.pop();
                break;
            }
        }
    }

    /// @notice Batch processing to add, update, and delete multiple files at once.
    /// @param cidsToAdd Array of new file CIDs to add.
    /// @param oldCidsToUpdate Array of existing file CIDs to update.
    /// @param newCidsToUpdate Array of new CIDs corresponding to each file update.
    /// @param cidsToDelete Array of file CIDs to delete.
    function batchFileOperations(
        string[] memory cidsToAdd,
        string[] memory oldCidsToUpdate,
        string[] memory newCidsToUpdate,
        string[] memory cidsToDelete
    ) public {
        // Process file additions.
        for (uint i = 0; i < cidsToAdd.length; i++) {
            addFile(cidsToAdd[i]);
        }

        // Process file updates.
        require(
            oldCidsToUpdate.length == newCidsToUpdate.length,
            "Update: Array length mismatch"
        );
        for (uint i = 0; i < oldCidsToUpdate.length; i++) {
            updateFile(oldCidsToUpdate[i], newCidsToUpdate[i]);
        }

        // Process file deletions.
        for (uint i = 0; i < cidsToDelete.length; i++) {
            deleteFile(cidsToDelete[i]);
        }
    }
} 