// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract KYCStorage {
    struct KYCRecord {
        address user;
        string name;
        string email;
        string ipfsHash;
        uint256 timestamp;
    }

    KYCRecord[] public records;

    event KYCUploaded(
        address indexed user,
        string name,
        string email,
        string ipfsHash,
        uint256 timestamp
    );

    function uploadKYC(
        string memory _name,
        string memory _email,
        string memory _ipfsHash
    ) public {
        records.push(KYCRecord(msg.sender, _name, _email, _ipfsHash, block.timestamp));
        emit KYCUploaded(msg.sender, _name, _email, _ipfsHash, block.timestamp);
    }

    function getRecords() public view returns (KYCRecord[] memory) {
        return records;
    }
}