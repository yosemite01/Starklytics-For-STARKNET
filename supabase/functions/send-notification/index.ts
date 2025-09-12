import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { to, subject, template, data } = await req.json()

    // Simulate email sending (integrate with SendGrid/Resend in production)
    console.log(`Sending email to ${to}: ${subject}`)
    
    const emailSent = Math.random() > 0.1 // 90% success rate

    return new Response(
      JSON.stringify({ success: emailSent, messageId: `msg_${Date.now()}` }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})