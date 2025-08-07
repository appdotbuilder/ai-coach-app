
import { db } from '../db';
import { llmAnalysisTable, chatMessagesTable } from '../db/schema';
import { type ProcessMessageWithLlmInput, type LlmAnalysis } from '../schema';
import { eq } from 'drizzle-orm';

export const processMessageWithLlm = async (input: ProcessMessageWithLlmInput): Promise<LlmAnalysis> => {
  try {
    // Verify the message exists
    const message = await db.select()
      .from(chatMessagesTable)
      .where(eq(chatMessagesTable.id, input.message_id))
      .execute();

    if (message.length === 0) {
      throw new Error(`Message with id ${input.message_id} not found`);
    }

    // Create mock analysis data based on analysis type
    let extractedData: Record<string, any> | null = null;
    let insights: string | null = null;
    let recommendations: string[] | null = null;
    let confidenceScore: number | null = null;

    switch (input.analysis_type) {
      case 'data_extraction':
        extractedData = {
          activity: {
            type: 'running',
            duration: 30,
            intensity: 'moderate'
          }
        };
        confidenceScore = 0.85;
        break;
      case 'recommendation':
        recommendations = [
          'Consider increasing workout intensity gradually',
          'Stay hydrated during exercise'
        ];
        confidenceScore = 0.78;
        break;
      case 'insight_generation':
        insights = 'User shows consistent exercise patterns with room for improvement in duration';
        confidenceScore = 0.82;
        break;
      case 'goal_tracking':
        extractedData = {
          progress: {
            current_value: 15,
            target_value: 30,
            percentage: 50
          }
        };
        insights = 'User is 50% towards their fitness goal';
        confidenceScore = 0.90;
        break;
    }

    // Insert LLM analysis record
    const result = await db.insert(llmAnalysisTable)
      .values({
        message_id: input.message_id,
        model_used: input.model_name,
        analysis_type: input.analysis_type,
        extracted_data: extractedData,
        insights: insights,
        recommendations: recommendations,
        confidence_score: confidenceScore?.toString() // Convert number to string for numeric column
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const analysis = result[0];
    return {
      ...analysis,
      confidence_score: analysis.confidence_score ? parseFloat(analysis.confidence_score) : null,
      extracted_data: analysis.extracted_data as Record<string, any> | null,
      recommendations: analysis.recommendations as string[] | null
    };
  } catch (error) {
    console.error('LLM processing failed:', error);
    throw error;
  }
};
