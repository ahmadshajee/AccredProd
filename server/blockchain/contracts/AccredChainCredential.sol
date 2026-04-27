// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract AccredChainCredential is ERC721URIStorage, AccessControl {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant ISSUER_ROLE = keccak256("ISSUER_ROLE");

    uint256 private _nextTokenId;

    struct Credential {
        address issuer;
        string credentialType;
        uint256 issuedAt;
        uint256 expiresAt;
        bool isRevoked;
        bool transferable;
    }

    mapping(uint256 => Credential) public credentials;

    event CredentialIssued(uint256 indexed tokenId, address indexed recipient, address indexed issuer, string credentialType);
    event CredentialRevoked(uint256 indexed tokenId);

    constructor() ERC721("AccredChainCredential", "ACC") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(ISSUER_ROLE, msg.sender);
        _nextTokenId = 1;
    }

    function issueCredential(address recipient, string memory ipfsCID, string memory credentialType, uint256 expiresAt) public onlyRole(ISSUER_ROLE) returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        _mint(recipient, tokenId);
        _setTokenURI(tokenId, ipfsCID);

        credentials[tokenId] = Credential({
            issuer: msg.sender,
            credentialType: credentialType,
            issuedAt: block.timestamp,
            expiresAt: expiresAt,
            isRevoked: false,
            transferable: false
        });

        emit CredentialIssued(tokenId, recipient, msg.sender, credentialType);
        return tokenId;
    }

    function revokeCredential(uint256 tokenId) public {
        require(hasRole(ADMIN_ROLE, msg.sender) || hasRole(ISSUER_ROLE, msg.sender), "Caller is not admin or issuer");
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        credentials[tokenId].isRevoked = true;
        emit CredentialRevoked(tokenId);
    }

    function isExpired(uint256 tokenId) public view returns (bool) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        if (credentials[tokenId].expiresAt == 0) {
            return false;
        }
        return block.timestamp > credentials[tokenId].expiresAt;
    }

    function isValid(uint256 tokenId) public view returns (bool) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        Credential memory cred = credentials[tokenId];
        bool expired = cred.expiresAt != 0 && block.timestamp > cred.expiresAt;
        return !cred.isRevoked && !expired;
    }

    function unlockTransfer(uint256 tokenId) public onlyRole(ADMIN_ROLE) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        credentials[tokenId].transferable = true;
    }

    function registerIssuer(address institution) public onlyRole(ADMIN_ROLE) {
        grantRole(ISSUER_ROLE, institution);
    }

    function removeIssuer(address institution) public onlyRole(ADMIN_ROLE) {
        revokeRole(ISSUER_ROLE, institution);
    }

    // Block transfers unless the transfer is unlocked (or from standard mint/burn logic)
    function _update(address to, uint256 tokenId, address auth) internal virtual override returns (address) {
        address from = _ownerOf(tokenId);
        if (from != address(0) && to != address(0)) {
            require(credentials[tokenId].transferable, "Credential is not transferable");
        }
        return super._update(to, tokenId, auth);
    }

    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC721URIStorage, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
