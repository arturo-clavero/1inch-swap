import { ethers } from 'ethers';

export function generateSecret() {
    const secret = ethers.hexlify(ethers.randomBytes(32));
    const hash = ethers.keccak256(secret);
    localStorage.setItem("secret", secret);
    localStorage.setItem("hash", hash);

    console.log("hash is:", hash);
    return {hash, secret};
}

// export default generateSecret;