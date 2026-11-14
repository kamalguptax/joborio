<?php

use App\Http\Controllers\Api\V1\Admin\AdminActivityController;
use App\Http\Controllers\Api\V1\Admin\AdminDashboardController;
use App\Http\Controllers\Api\V1\Admin\PublisherReviewController as AdminPublisherReviewController;
use App\Http\Controllers\Api\V1\Admin\AdminDisputeController;
use App\Http\Controllers\Api\V1\Admin\AdminJobMasterController;
use App\Http\Controllers\Api\V1\Admin\AdminSyndicationFeedController;
use App\Http\Controllers\Api\V1\Admin\AdminTrackedWebsiteController;
use App\Http\Controllers\Api\V1\Admin\AdminUserController;
use App\Http\Controllers\Api\V1\Admin\FraudQueueController;
use App\Http\Controllers\Api\V1\Admin\PayoutController;
use App\Http\Controllers\Api\V1\Admin\CampaignEarningsController;
use App\Http\Controllers\Api\V1\Admin\ProgramController as AdminProgramController;
use App\Http\Controllers\Api\V1\Auth\AuthController;
use App\Http\Controllers\Api\V1\Auth\BrandAuthController;
use App\Http\Controllers\Api\V1\Auth\PublisherAuthController;
use App\Http\Controllers\Api\V1\Auth\SocialAuthController;
use App\Http\Controllers\Api\V1\Network\DashboardController as NetworkDashboardController;
use App\Http\Controllers\Api\V1\Network\MembershipController as NetworkMembershipController;
use App\Http\Controllers\Api\V1\Publisher\MemberController as PublisherMemberController;
use App\Http\Controllers\Api\V1\Public\JoinInvitationController;
use App\Http\Controllers\Api\V1\Publisher\CampaignAssignmentController as PublisherCampaignAssignmentController;
use App\Http\Controllers\Api\V1\Publisher\CommunityController as PublisherCommunityController;
use App\Http\Controllers\Api\V1\Publisher\DashboardController as PublisherDashboardController;
use App\Http\Controllers\Api\V1\Publisher\InvitationController as PublisherInvitationController;
use App\Http\Controllers\Api\V1\Publisher\EarningsController as PublisherEarningsController;
use App\Http\Controllers\Api\V1\Publisher\IntegrationController as PublisherIntegrationController;
use App\Http\Controllers\Api\V1\Publisher\PaymentHistoryController as PublisherPaymentHistoryController;
use App\Http\Controllers\Api\V1\Publisher\ReportController as PublisherReportController;
use App\Http\Controllers\Api\V1\Publisher\SettingsController as PublisherSettingsController;
use App\Http\Controllers\Api\V1\Publisher\CommissionController as PublisherCommissionController;
use App\Http\Controllers\Api\V1\Publisher\TeamController as PublisherTeamController;
use App\Http\Controllers\Api\V1\Webhooks\PublisherWebhookController;
use App\Http\Controllers\Api\V1\Creator\CreatorListingController;
use App\Http\Controllers\Api\V1\Creator\DashboardController;
use App\Http\Controllers\Api\V1\Creator\AiPostStudioController;
use App\Http\Controllers\Api\V1\Creator\NotificationController;
use App\Http\Controllers\Api\V1\Creator\TrustTierController;
use App\Http\Controllers\Api\V1\Creator\ReferralController;
use App\Http\Controllers\Api\V1\Creator\PprRegistrationController;
use App\Http\Controllers\Api\V1\Creator\JobPreferenceController as CreatorJobPreferenceController;
use App\Http\Controllers\Api\V1\Creator\OnboardingController;
use App\Http\Controllers\Api\V1\Creator\JobActivityController;
use App\Http\Controllers\Api\V1\Creator\PayoutMethodController;
use App\Http\Controllers\Api\V1\Creator\TransactionController;
use App\Http\Controllers\Api\V1\Creator\PostPromoteController;
use App\Http\Controllers\Api\V1\Creator\ProgramController as CreatorProgramController;
use App\Http\Controllers\Api\V1\Employer\PostPromoteReviewController;
use App\Http\Controllers\Api\V1\Creator\TrackingLinkController;
use App\Http\Controllers\Api\V1\Employer\BillingController as EmployerBillingController;
use App\Http\Controllers\Api\V1\Employer\PaymentController as EmployerPaymentController;
use App\Http\Controllers\Api\V1\Employer\JobPreferenceController as EmployerJobPreferenceController;
use App\Http\Controllers\Api\V1\Employer\OnboardingController as EmployerOnboardingController;
use App\Http\Controllers\Api\V1\Employer\PpaApplicationController as EmployerPpaApplicationController;
use App\Http\Controllers\Api\V1\Employer\ProgramController as EmployerProgramController;
use App\Http\Controllers\Api\V1\NicheController;
use App\Http\Controllers\Api\V1\Admin\ListingController as AdminListingController;
use App\Http\Controllers\Api\V1\Public\CreatorPageController;
use App\Http\Controllers\Api\V1\Public\JobMasterController;
use App\Http\Controllers\Api\V1\Public\JobrapidoSyndicationController;
use App\Http\Controllers\Api\V1\Admin\AdminGeoController;
use App\Http\Controllers\Api\V1\Admin\PlatformSettingsController;
use App\Http\Controllers\Api\V1\Public\ListingController;
use App\Http\Controllers\Api\V1\Public\MapsController;
use App\Http\Controllers\Api\V1\Public\LeaderboardController;
use App\Http\Controllers\Api\V1\Public\WebsiteTrackingController;
use App\Http\Controllers\Api\V1\Public\XmlClickController;
use App\Http\Controllers\Api\V1\Public\PprVerificationController;
use App\Http\Controllers\Api\V1\Webhooks\PpaWebhookController;
use App\Http\Controllers\Api\V1\Webhooks\PprWebhookController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    Route::get('/health', fn () => response()->json(['ok' => true, 'service' => 'joborio-api']));
    Route::get('/go/{code}', [XmlClickController::class, 'show'])
        ->where('code', '[A-Za-z0-9]+');

    Route::get('/niches', [NicheController::class, 'index']);
    Route::get('/job-masters/filters', [JobMasterController::class, 'filters']);
    Route::get('/listings', [ListingController::class, 'index']);
    Route::get('/listings/map-points', [MapsController::class, 'listingPoints']);
    Route::get('/listings/{listing}', [ListingController::class, 'show']);
    Route::get('/maps/config', [MapsController::class, 'config']);
    Route::get('/maps/reverse', [MapsController::class, 'reverse']);
    Route::get('/syndication/vigyapanam/jobs', [JobrapidoSyndicationController::class, 'index']);
    Route::get('/syndication/vigyapanam/jobs/{referenceId}', [JobrapidoSyndicationController::class, 'show'])
        ->where('referenceId', '[A-Za-z0-9._:\-]+');
    Route::post('/syndication/vigyapanam/refresh', [JobrapidoSyndicationController::class, 'refresh']);
    Route::get('/public/creators/{handle}', [CreatorPageController::class, 'show']);
    Route::get('/public/leaderboard', [LeaderboardController::class, 'index']);

    Route::post('/webhooks/ppr', [PprWebhookController::class, 'store']);
    Route::post('/webhooks/ppa', [PpaWebhookController::class, 'store']);
    Route::post('/webhooks/publisher/{publisherCode}', [PublisherWebhookController::class, 'receive'])
        ->where('publisherCode', '[A-Za-z0-9_\-]+');
    Route::get('/ppr/verify/{pprRegistration}', [PprVerificationController::class, 'verify']);

    Route::get('/auth/providers', [SocialAuthController::class, 'providers']);
    Route::get('/auth/{provider}/redirect', [SocialAuthController::class, 'redirect'])
        ->where('provider', 'google|linkedin');
    Route::get('/auth/{provider}/callback', [SocialAuthController::class, 'callback'])
        ->where('provider', 'google|linkedin');

    Route::post('/auth/register', [AuthController::class, 'register']);
    Route::post('/auth/login', [AuthController::class, 'login']);

    Route::get('/auth/captcha', [BrandAuthController::class, 'captcha']);
    Route::post('/auth/brand/register', [BrandAuthController::class, 'register']);
    Route::post('/auth/publisher/register', [PublisherAuthController::class, 'register']);
    Route::post('/auth/publisher/login', [PublisherAuthController::class, 'login']);
    Route::get('/auth/publisher/check-username', [PublisherAuthController::class, 'checkUsername']);
    Route::post('/auth/email/verify-otp', [BrandAuthController::class, 'verifyOtp']);
    Route::post('/auth/email/resend-otp', [BrandAuthController::class, 'resendOtp']);
    Route::post('/auth/forgot-password', [BrandAuthController::class, 'forgotPassword']);
    Route::post('/auth/reset-password', [BrandAuthController::class, 'resetPassword']);

    Route::get('/join/invitation', [JoinInvitationController::class, 'show']);
    Route::post('/join/invitation/accept', [JoinInvitationController::class, 'accept']);

    Route::get('/track/script/{publicKey}.js', [WebsiteTrackingController::class, 'script'])
        ->where('publicKey', '[a-z0-9]{32}');
    Route::middleware('tracking.cors')->group(function () {
        Route::post('/track/hit/{publicKey}', [WebsiteTrackingController::class, 'hit'])
            ->where('publicKey', '[a-z0-9]{32}');
        Route::options('/track/hit/{publicKey}', fn () => response('', 204))
            ->where('publicKey', '[a-z0-9]{32}');
    });

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/auth/logout', [AuthController::class, 'logout']);
        Route::get('/auth/me', [AuthController::class, 'me']);

        Route::post('/creator/onboarding', [OnboardingController::class, 'store']);
        Route::put('/creator/onboarding', [OnboardingController::class, 'update']);
        Route::get('/creator/dashboard', [DashboardController::class, 'show']);
        Route::get('/creator/clicks', [DashboardController::class, 'clicks']);
        Route::get('/creator/earnings', [DashboardController::class, 'earnings']);
        Route::get('/creator/transactions', [TransactionController::class, 'index']);
        Route::get('/creator/registrations', [PprRegistrationController::class, 'index']);
        Route::get('/creator/referrals', [ReferralController::class, 'show']);
        Route::post('/creator/referrals/claim', [ReferralController::class, 'claim']);
        Route::get('/creator/notifications', [NotificationController::class, 'index']);
        Route::post('/creator/notifications/read-all', [NotificationController::class, 'markAllRead']);
        Route::post('/creator/notifications/{userNotification}/read', [NotificationController::class, 'markRead']);
        Route::get('/creator/trust-tier', [TrustTierController::class, 'show']);
        Route::get('/creator/ai-studio/quota', [AiPostStudioController::class, 'quota']);
        Route::post('/creator/ai-studio/generate', [AiPostStudioController::class, 'generate']);
        Route::get('/creator/payout-account', [PayoutMethodController::class, 'show']);
        Route::put('/creator/payout-account', [PayoutMethodController::class, 'update']);
        Route::put('/creator/payout-method', [PayoutMethodController::class, 'update']);
        Route::get('/creator/job-preferences', [CreatorJobPreferenceController::class, 'show']);
        Route::put('/creator/job-preferences', [CreatorJobPreferenceController::class, 'update']);
        Route::get('/creator/preferred-jobs', [CreatorJobPreferenceController::class, 'preferredJobs']);
        Route::get('/creator/listings', [CreatorListingController::class, 'index']);
        Route::patch('/creator/listings/{listing}', [CreatorListingController::class, 'update']);
        Route::get('/creator/listings/{listing}/track-link', [TrackingLinkController::class, 'show']);
        Route::post('/creator/job-activity', [JobActivityController::class, 'store']);
        Route::get('/creator/campaigns', [CreatorProgramController::class, 'index']);
        Route::post('/creator/campaigns/{program}/opt-in', [CreatorProgramController::class, 'optIn']);
        Route::post('/creator/campaigns/{program}/opt-out', [CreatorProgramController::class, 'optOut']);
        Route::post('/creator/campaigns/{program}/post-promote', [PostPromoteController::class, 'store']);

        Route::post('/employer/onboarding', [EmployerOnboardingController::class, 'store']);

        Route::middleware('role:employer')->prefix('employer')->group(function () {
            Route::get('/me', [EmployerOnboardingController::class, 'show']);
            Route::get('/billing', [EmployerBillingController::class, 'show']);
            Route::put('/billing', [EmployerBillingController::class, 'update']);
            Route::get('/payments/razorpay/config', [EmployerPaymentController::class, 'config']);
            Route::post('/payments/razorpay/order', [EmployerPaymentController::class, 'createOrder']);
            Route::post('/payments/razorpay/verify', [EmployerPaymentController::class, 'verify']);
            Route::get('/payments/history', [EmployerPaymentController::class, 'history']);
            Route::get('/job-preferences', [EmployerJobPreferenceController::class, 'show']);
            Route::put('/job-preferences', [EmployerJobPreferenceController::class, 'update']);
            Route::get('/preferred-jobs', [EmployerJobPreferenceController::class, 'preferredJobs']);
            Route::get('/programs', [EmployerProgramController::class, 'index']);
            Route::post('/programs', [EmployerProgramController::class, 'store']);
            Route::get('/programs/{program}', [EmployerProgramController::class, 'show']);
            Route::post('/programs/{program}/pause', [EmployerProgramController::class, 'pause']);
            Route::post('/programs/{program}/resume', [EmployerProgramController::class, 'resume']);
            Route::post('/programs/{program}/go-live', [EmployerProgramController::class, 'resume']);
            Route::post('/programs/{program}/sync-ads', [EmployerProgramController::class, 'syncAds']);
            Route::get('/programs/{program}/post-promote', [PostPromoteReviewController::class, 'index']);
            Route::post('/programs/{program}/post-promote/{submission}/approve', [PostPromoteReviewController::class, 'approve']);
            Route::post('/programs/{program}/post-promote/{submission}/reject', [PostPromoteReviewController::class, 'reject']);
            Route::get('/programs/{program}/applications', [EmployerPpaApplicationController::class, 'index']);
            Route::post('/programs/{program}/applications/{application}/confirm', [EmployerPpaApplicationController::class, 'confirm']);
            Route::post('/programs/{program}/applications/{application}/reject', [EmployerPpaApplicationController::class, 'reject']);
            Route::post('/programs/{program}/applications/{application}/dispute', [EmployerPpaApplicationController::class, 'dispute']);
        });

        Route::middleware('role:network_member')->prefix('network')->group(function () {
            Route::get('/dashboard', [NetworkDashboardController::class, 'show']);
            Route::post('/membership/leave', [NetworkMembershipController::class, 'leave']);
        });

        Route::middleware('role:publisher')->prefix('publisher')->group(function () {
            Route::get('/dashboard', [PublisherDashboardController::class, 'show']);
            Route::get('/communities', [PublisherCommunityController::class, 'index']);
            Route::post('/communities', [PublisherCommunityController::class, 'store']);
            Route::put('/communities/{community}', [PublisherCommunityController::class, 'update']);
            Route::get('/invitations', [PublisherInvitationController::class, 'index']);
            Route::post('/invitations', [PublisherInvitationController::class, 'store']);
            Route::post('/invitations/import-csv', [PublisherInvitationController::class, 'importCsv']);
            Route::get('/members', [PublisherInvitationController::class, 'members']);
            Route::post('/members/{member}/remove', [PublisherMemberController::class, 'remove']);
            Route::post('/members/{member}/release', [PublisherMemberController::class, 'release']);
            Route::get('/members/{member}/activity', [PublisherMemberController::class, 'activity']);
            Route::get('/commission', [PublisherCommissionController::class, 'show']);
            Route::put('/commission', [PublisherCommissionController::class, 'update']);
            Route::get('/marketplace', [PublisherCampaignAssignmentController::class, 'marketplace']);
            Route::get('/assignments', [PublisherCampaignAssignmentController::class, 'index']);
            Route::post('/assignments', [PublisherCampaignAssignmentController::class, 'store']);
            Route::post('/assignments/{assignment}/pause', [PublisherCampaignAssignmentController::class, 'pause']);
            Route::get('/reports', [PublisherReportController::class, 'show']);
            Route::get('/earnings', [PublisherEarningsController::class, 'show']);
            Route::get('/payments', [PublisherPaymentHistoryController::class, 'show']);
            Route::get('/integrations', [PublisherIntegrationController::class, 'show']);
            Route::put('/integrations/preference', [PublisherIntegrationController::class, 'updatePreference']);
            Route::post('/integrations/credentials', [PublisherIntegrationController::class, 'createCredential']);
            Route::put('/integrations/credentials/{credential}', [PublisherIntegrationController::class, 'updateCredential']);
            Route::post('/integrations/credentials/{credential}/rotate', [PublisherIntegrationController::class, 'rotateCredential']);
            Route::post('/integrations/credentials/{credential}/revoke', [PublisherIntegrationController::class, 'revokeCredential']);
            Route::post('/integrations/members', [PublisherIntegrationController::class, 'createMemberInvite']);
            Route::get('/settings', [PublisherSettingsController::class, 'show']);
            Route::put('/settings/profile', [PublisherSettingsController::class, 'updateProfile']);
            Route::put('/settings/password', [PublisherSettingsController::class, 'updatePassword']);
            Route::post('/settings/sessions/revoke-others', [PublisherSettingsController::class, 'revokeOtherSessions']);
            Route::get('/team', [PublisherTeamController::class, 'index']);
            Route::post('/team/managers', [PublisherTeamController::class, 'inviteManager']);
        });

        Route::middleware('role:admin')->prefix('admin')->group(function () {
            Route::get('/overview', [AdminDashboardController::class, 'overview']);
            Route::get('/users', [AdminUserController::class, 'index']);
            Route::get('/users/{user}', [AdminUserController::class, 'show']);
            Route::patch('/users/{user}', [AdminUserController::class, 'update']);
            Route::get('/activity', [AdminActivityController::class, 'index']);
            Route::get('/geo/traffic-map', [AdminGeoController::class, 'trafficMap']);
            Route::get('/platform-settings', [PlatformSettingsController::class, 'show']);
            Route::put('/platform-settings', [PlatformSettingsController::class, 'update']);
            Route::get('/tracked-websites', [AdminTrackedWebsiteController::class, 'index']);
            Route::post('/tracked-websites', [AdminTrackedWebsiteController::class, 'store']);
            Route::get('/tracked-websites/{trackedWebsite}', [AdminTrackedWebsiteController::class, 'show']);
            Route::put('/tracked-websites/{trackedWebsite}', [AdminTrackedWebsiteController::class, 'update']);
            Route::delete('/tracked-websites/{trackedWebsite}', [AdminTrackedWebsiteController::class, 'destroy']);
            Route::get('/syndication-feeds', [AdminSyndicationFeedController::class, 'index']);
            Route::post('/syndication-feeds', [AdminSyndicationFeedController::class, 'store']);
            Route::put('/syndication-feeds/{syndicationFeed}', [AdminSyndicationFeedController::class, 'update']);
            Route::delete('/syndication-feeds/{syndicationFeed}', [AdminSyndicationFeedController::class, 'destroy']);
            Route::post('/syndication-feeds/refresh-all', [AdminSyndicationFeedController::class, 'refreshAll']);
            Route::post('/syndication-feeds/{syndicationFeed}/refresh', [AdminSyndicationFeedController::class, 'refresh']);
            Route::post('/syndication-feeds/{syndicationFeed}/probe', [AdminSyndicationFeedController::class, 'probe']);
            Route::get('/job-masters', [AdminJobMasterController::class, 'index']);
            Route::post('/job-masters', [AdminJobMasterController::class, 'store']);
            Route::put('/job-masters/{jobMaster}', [AdminJobMasterController::class, 'update']);
            Route::delete('/job-masters/{jobMaster}', [AdminJobMasterController::class, 'destroy']);
            Route::get('/listings', [AdminListingController::class, 'index']);
            Route::post('/listings', [AdminListingController::class, 'store']);
            Route::put('/listings/{listing}', [AdminListingController::class, 'update']);
            Route::delete('/listings/{listing}', [AdminListingController::class, 'destroy']);
            Route::post('/listings/ingest', [AdminListingController::class, 'ingestNow']);
            Route::get('/fraud-queue', [FraudQueueController::class, 'index']);
            Route::post('/fraud-queue/{fraudReview}/resolve', [FraudQueueController::class, 'resolve']);
            Route::get('/disputes', [AdminDisputeController::class, 'index']);
            Route::post('/disputes/{attributionDispute}/resolve', [AdminDisputeController::class, 'resolve']);
            Route::get('/payouts/transactions', [PayoutController::class, 'transactions']);
            Route::get('/payouts/preview', [PayoutController::class, 'previewBatch']);
            Route::get('/payouts/batches', [PayoutController::class, 'indexBatches']);
            Route::post('/payouts/batches', [PayoutController::class, 'createBatch']);
            Route::post('/payouts/batches/{payoutBatch}/complete', [PayoutController::class, 'completeBatch']);
            Route::get('/programs', [AdminProgramController::class, 'index']);
            Route::post('/programs', [AdminProgramController::class, 'store']);
            Route::post('/programs/{program}/activate', [AdminProgramController::class, 'activate']);
            Route::post('/programs/{program}/pause', [AdminProgramController::class, 'pause']);
            Route::get('/campaign-earnings', [CampaignEarningsController::class, 'index']);
            Route::get('/publishers', [AdminPublisherReviewController::class, 'index']);
            Route::post('/publishers/{publisher}/activate', [AdminPublisherReviewController::class, 'activate']);
        });
    });
});
