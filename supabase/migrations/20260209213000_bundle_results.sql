-- Create bundle_results table to store execution history
CREATE TABLE IF NOT EXISTS public.bundle_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bundle_id UUID NOT NULL REFERENCES public.bundles(id) ON DELETE CASCADE,
    result_content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.bundle_results ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own bundle results"
    ON public.bundle_results FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.bundles
            WHERE bundles.id = bundle_results.bundle_id
            AND bundles.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create results for their own bundles"
    ON public.bundle_results FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.bundles
            WHERE bundles.id = bundle_results.bundle_id
            AND bundles.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete results of their own bundles"
    ON public.bundle_results FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.bundles
            WHERE bundles.id = bundle_results.bundle_id
            AND bundles.user_id = auth.uid()
        )
    );
