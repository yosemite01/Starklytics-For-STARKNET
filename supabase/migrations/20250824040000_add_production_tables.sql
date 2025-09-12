-- Add transaction tracking
CREATE TABLE bounty_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    bounty_id UUID REFERENCES bounties(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('deposit', 'payout')),
    amount DECIMAL NOT NULL,
    token TEXT NOT NULL,
    tx_hash TEXT,
    block_number BIGINT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed'))
);

-- Add notification tracking
CREATE TABLE notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id),
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT false,
    email_sent BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}'::JSONB
);

-- Add rate limiting tracking
CREATE TABLE rate_limits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    identifier TEXT NOT NULL,
    endpoint TEXT NOT NULL,
    count INTEGER DEFAULT 1,
    window_start TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(identifier, endpoint)
);

-- Add contract deployment info
CREATE TABLE contract_deployments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    network TEXT NOT NULL,
    contract_address TEXT NOT NULL,
    class_hash TEXT NOT NULL,
    deployer_address TEXT,
    deployment_tx_hash TEXT,
    status TEXT DEFAULT 'deployed'
);

-- Enable RLS
ALTER TABLE bounty_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_deployments ENABLE ROW LEVEL SECURITY;

-- Policies for bounty_transactions
CREATE POLICY "Users can view transactions for their bounties"
    ON bounty_transactions FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM bounties
            WHERE bounties.id = bounty_transactions.bounty_id
            AND (bounties.creator_id = auth.uid() OR bounties.winner_id = auth.uid())
        )
    );

-- Policies for notifications
CREATE POLICY "Users can view their own notifications"
    ON notifications FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
    ON notifications FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid());

-- Add indexes for performance
CREATE INDEX idx_bounty_transactions_bounty_id ON bounty_transactions(bounty_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_rate_limits_identifier ON rate_limits(identifier, endpoint);

-- Add bounty status update triggers
CREATE OR REPLACE FUNCTION notify_bounty_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status != NEW.status THEN
        INSERT INTO notifications (user_id, type, title, message, metadata)
        VALUES (
            NEW.creator_id,
            'bounty_status_change',
            'Bounty Status Updated',
            'Your bounty "' || NEW.title || '" status changed to ' || NEW.status,
            jsonb_build_object('bounty_id', NEW.id, 'old_status', OLD.status, 'new_status', NEW.status)
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER bounty_status_change_trigger
    AFTER UPDATE ON bounties
    FOR EACH ROW
    EXECUTE FUNCTION notify_bounty_status_change();