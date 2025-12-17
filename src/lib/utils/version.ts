/**
 * Semantic versioning utility functions using the semver package
 * Supports full semantic versioning including pre-release versions (alpha, beta, rc, etc.)
 */

import semver from "semver";

/**
 * Compare two semantic versions
 * Returns: 1 if v1 > v2, -1 if v1 < v2, 0 if equal
 * Supports pre-release versions like 2.1.0-alpha, 2.1.0-beta.2, etc.
 */
export function compareVersions(v1: string, v2: string): number {
	return semver.compare(v1, v2);
}

/**
 * Check if version v1 is greater than v2
 * Supports pre-release versions
 */
export function isNewerVersion(v1: string, v2: string): boolean {
	return semver.gt(v1, v2);
}

/**
 * Check if version v1 equals v2
 */
export function isSameVersion(v1: string, v2: string): boolean {
	return semver.eq(v1, v2);
}

/**
 * Get the type of version bump (major, minor, patch, or prerelease)
 * Supports pre-release versions
 */
export function getVersionBumpType(
	oldVersion: string,
	newVersion: string,
): "major" | "minor" | "patch" | "prerelease" | "none" {
	if (!semver.valid(oldVersion) || !semver.valid(newVersion)) {
		return "none";
	}

	const diff = semver.diff(oldVersion, newVersion);
	
	if (diff === "major" || diff === "premajor") return "major";
	if (diff === "minor" || diff === "preminor") return "minor";
	if (diff === "patch" || diff === "prepatch") return "patch";
	if (diff === "prerelease") return "prerelease";
	
	return "none";
}

/**
 * Get user's last seen version from localStorage
 */
export function getLastSeenVersion(): string | null {
	if (typeof window === "undefined") return null;
	return localStorage.getItem("shusseki_last_seen_version");
}

/**
 * Save user's last seen version to localStorage
 */
export function setLastSeenVersion(version: string): void {
	if (typeof window === "undefined") return;
	localStorage.setItem("shusseki_last_seen_version", version);
}

/**
 * Check if user should see release notes
 * Returns true if current version is newer than last seen version
 * Also returns true for new users (no stored version)
 */
export function shouldShowReleaseNotes(currentVersion: string): boolean {
	const lastSeenVersion = getLastSeenVersion();

	// Validate current version first
	if (!semver.valid(currentVersion)) {
		return false;
	}

	// First time user or no version stored - SHOW notes to welcome them!
	if (!lastSeenVersion) {
		return true;
	}

	// Try to coerce invalid versions to valid format
	let validLastSeen = semver.valid(lastSeenVersion);
	if (!validLastSeen) {
		validLastSeen = semver.coerce(lastSeenVersion)?.version || null;
		
		if (!validLastSeen) {
			return true;
		}
	}

	// Compare versions
	const isNewer = semver.gt(currentVersion, validLastSeen);
	
	// Show if current version is newer than last seen
	return isNewer;
}

/**
 * Parse and format version for display
 * Returns formatted version with pre-release info
 */
export function formatVersion(version: string): string {
	const parsed = semver.parse(version);
	if (!parsed) return version;

	let formatted = `${parsed.major}.${parsed.minor}.${parsed.patch}`;
	
	if (parsed.prerelease.length > 0) {
		formatted += `-${parsed.prerelease.join(".")}`;
	}
	
	return formatted;
}

/**
 * Check if version is a pre-release
 */
export function isPrerelease(version: string): boolean {
	const parsed = semver.parse(version);
	return parsed ? parsed.prerelease.length > 0 : false;
}

/**
 * Get pre-release type (alpha, beta, rc, etc.)
 * Returns just the type name without version numbers (e.g., "beta" instead of "beta2")
 */
export function getPrereleaseType(version: string): string | null {
	const parsed = semver.parse(version);
	if (!parsed || parsed.prerelease.length === 0) return null;
	
	const type = String(parsed.prerelease[0]);
	// Remove any trailing numbers (e.g., "beta2" -> "beta", "alpha1" -> "alpha")
	return type.replace(/\d+$/, "");
}
