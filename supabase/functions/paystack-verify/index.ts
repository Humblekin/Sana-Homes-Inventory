import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const PAYSTACK_SECRET_KEY = Deno.env.get('PAYSTACK_SECRET_KEY') ?? ''

    if (!PAYSTACK_SECRET_KEY) {
      throw new Error('PAYSTACK_SECRET_KEY is not set in Supabase Settings -> API -> Secrets')
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
    const { reference } = await req.json()
    console.log(`[LOG] Verifying reference: ${reference}`)

    // 0. Check if order already exists for this reference (prevent replays)
    const { data: existingOrder } = await supabaseAdmin
      .from('orders')
      .select('id')
      .eq('payment_ref', reference)
      .maybeSingle()
    
    if (existingOrder) {
      console.warn(`[WARN] Reference ${reference} already fulfilled for Order #${existingOrder.id}`)
      return new Response(
        JSON.stringify({ success: true, orderId: existingOrder.id, message: 'Order already exists' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    // 1. Verify payment with Paystack
    const paystackRes = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY.trim()}` }
    })
    
    const paystackData = await paystackRes.json()
    
    if (!paystackRes.ok || !paystackData.status) {
      console.error(`[ERR] Paystack API Error: ${paystackData.message || 'Unknown'}`)
      throw new Error(`Paystack says: ${paystackData.message || 'Verification Failed'}`)
    }

    const { amount, customer, metadata } = paystackData.data
    console.log(`[LOG] Payment details: ₵${amount/100} from ${customer.email}`)

    // 2. Insert order
    console.log(`[LOG] Attempting database insert...`)
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert([{
        customer: metadata?.full_name || customer.email,
        email: customer.email,
        phone: metadata?.phone || '',
        address: metadata?.address || '',
        location: metadata?.location || 'Paystack Online',
        product: metadata?.model || 'Tricycle',
        quantity: metadata?.quantity || 1,
        amount: `₵${(amount / 100).toLocaleString()}`,
        status: 'pending',
        date: new Date().toISOString().split('T')[0],
        payment_ref: reference
      }])
      .select()
      .single()

    if (orderError) {
      console.error(`[ERR] Database Insert Failed: ${orderError.message}`)
      throw new Error(`Database Error: ${orderError.message}`)
    }
    console.log(`[LOG] Success! Order ID: ${order.id}`)

    // 3. Update Product Inventory & Sales
    console.log(`[LOG] Syncing inventory for: ${metadata?.model}`)
    if (metadata?.model) {
      // Find product by name and update
      const { data: productData } = await supabaseAdmin
        .from('products')
        .select('id, stock, sales')
        .eq('name', metadata.model)
        .maybeSingle()

      if (productData) {
        const newStock = Math.max(0, (productData.stock || 0) - (metadata.quantity || 1))
        const newSales = (productData.sales || 0) + (metadata.quantity || 1)
        
        await supabaseAdmin
          .from('products')
          .update({ stock: newStock, sales: newSales })
          .eq('id', productData.id)
        
        console.log(`[LOG] Inventory updated: Order #${order.id}`)

        // Also sync the 'inventory' table
        const { data: invData } = await supabaseAdmin
          .from('inventory')
          .select('id, stock')
          .eq('product', metadata.model)
          .maybeSingle()
        
        if (invData) {
          const newInvStock = Math.max(0, (invData.stock || 0) - (metadata.quantity || 1))
          const invStatus = newInvStock < 10 ? 'low' : 'instock'
          await supabaseAdmin
            .from('inventory')
            .update({ stock: newInvStock, status: invStatus })
            .eq('id', invData.id)
          console.log(`[LOG] Master inventory sync: ${metadata.model}`)
        }
      }
    }

    // 4. Log to finance
    await supabaseAdmin.from('finance').insert([{
      description: `Payment for Order #${order.id}`,
      amount: amount / 100,
      type: 'income',
      category: 'Sales',
      date: new Date().toISOString().split('T')[0]
    }])

    return new Response(
      JSON.stringify({ 
        success: true, 
        orderId: order.id,
        message: 'Order fulfilled successfully' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    console.error(`[CRITICAL] Edge Function Error: ${error.message}`)
    // Return 200 anyway so the frontend can read the JSON error message
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  }
})
