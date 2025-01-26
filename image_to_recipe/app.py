from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import openai
from PIL import Image
import os
import requests
import boto3
import json
from io import BytesIO
from dotenv import load_dotenv
import concurrent.futures
from functools import lru_cache
from mangum import Mangum

app = Flask(__name__)
CORS(app)

# Environment setup
load_dotenv()

# AWS S3 setup
s3 = boto3.client('s3')
BUCKET_NAME = os.environ.get('S3_BUCKET_NAME', 'recipe-generator-images')

# CORS configuration for Lambda
CORS(app, resources={
    r"/*": {
        "origins": [
            "*"  # Update with your Amplify domain in production
        ],
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

# Initialize OpenAI
openai.api_key = os.getenv('OPENAI_API_KEY')

class RecipeGenerator:
    def __init__(self):
        self.image_folder = '/tmp/generated_recipes'
        os.makedirs(self.image_folder, exist_ok=True)

    @lru_cache(maxsize=128)
    def _validate_ingredients_cached(self, ingredients_tuple):
        ingredients_list = list(ingredients_tuple)
        prompt = f"""Analyze these ingredients and provide validation info:
        Ingredients: {', '.join(ingredients_list)}
        
        Please check:
        1. Are these common cooking ingredients?
        2. Are there any potentially unsafe combinations?
        3. What type of dishes could these ingredients make?
        
        Format response as a brief summary."""

        try:
            response = openai.ChatCompletion.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": "You are a chef validating cooking ingredients."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            print(f"OpenAI API error: {str(e)}")
            return None

    def validate_ingredients(self, ingredients):
        try:
            if not ingredients or len(ingredients) < 2:
                return None
            ingredients_tuple = tuple(sorted(ingredients))
            return self._validate_ingredients_cached(ingredients_tuple)
        except Exception as e:
            print(f"Validation error: {str(e)}")
            return None

    def generate_recipe_options(self, ingredients):
        try:
            prompt = f"""Create 6 unique recipe ideas using these ingredients: {', '.join(ingredients)}
            
            For each recipe provide:
            1. A creative name
            2. A brief description
            3. A list of any additional key ingredients needed
            4. Estimated cooking time
            5. Difficulty level (Easy, Medium, Hard)
            
            Format as JSON:
            [
                {{
                    "name": "Recipe Name",
                    "description": "Brief description",
                    "additionalIngredients": ["ingredient1", "ingredient2"],
                    "timeEstimate": "20-30 mins",
                    "difficulty": "Easy"
                }}
            ]"""

            response = openai.ChatCompletion.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": "You are a creative international chef generating diverse recipes."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.8
            )

            recipes = json.loads(response.choices[0].message.content.strip())
            return recipes[:6] if len(recipes) > 6 else recipes

        except Exception as e:
            print(f"Recipe generation error: {str(e)}")
            return None

    def generate_detailed_recipe(self, recipe_name, ingredients):
        try:
            prompt = f"""Create a detailed recipe for: {recipe_name}
            Using these ingredients: {', '.join(ingredients)}

            Format:
            Cooking Time: [minutes]
            Servings: [number]
            Difficulty: [Easy/Medium/Hard]

            Ingredients:
            - [Exact measurements]

            Instructions:
            1. [Detailed steps]

            Chef's Tips:
            - [3 tips]

            Nutritional Information (per serving):
            - [Complete breakdown]
            """

            response = openai.ChatCompletion.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": "You are a professional chef creating precise recipes."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7
            )
            
            return response.choices[0].message.content.strip()
        except Exception as e:
            print(f"Detailed recipe error: {str(e)}")
            return None

    def get_nutrition_analysis(self, recipe_name, ingredients):
        try:
            prompt = f"""Analyze nutrition for {recipe_name} with {', '.join(ingredients)}:
            1. Macronutrients
            2. Micronutrients
            3. Calories
            4. Daily values
            5. Health benefits
            6. Glycemic index
            7. Allergens
            8. Improvement suggestions"""

            response = openai.ChatCompletion.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": "You are a certified nutritionist."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3
            )
            
            return response.choices[0].message.content.strip()
        except Exception as e:
            print(f"Nutrition analysis error: {str(e)}")
            return None

    def create_recipe_image(self, recipe_name):
        try:
            prompt = f"Professional food photo of {recipe_name}, beautiful plating, soft lighting, high resolution"
            
            response = openai.Image.create(
                prompt=prompt,
                n=1,
                size="512x512"
            )
            
            image_url = response['data'][0]['url']
            image_response = requests.get(image_url)
            
            if image_response.status_code != 200:
                raise Exception("Image download failed")
            
            filename = f"{recipe_name.lower().replace(' ', '_')}.png"
            filename = ''.join(c for c in filename if c.isalnum() or c == '_')
            
            # Upload to S3
            s3.put_object(
                Bucket=BUCKET_NAME,
                Key=filename,
                Body=image_response.content,
                ContentType='image/png'
            )
            
            # Generate presigned URL
            url = s3.generate_presigned_url(
                'get_object',
                Params={'Bucket': BUCKET_NAME, 'Key': filename},
                ExpiresIn=3600
            )
            
            return url
            
        except Exception as e:
            print(f"Image creation error: {str(e)}")
            return None

recipe_generator = RecipeGenerator()

@app.route('/api/generate-recipes', methods=['POST', 'OPTIONS'])
def generate_recipes():
    if request.method == "OPTIONS":
        return "", 200
        
    try:
        data = request.json
        ingredients = data.get('ingredients', [])
        
        if not ingredients or len(ingredients) < 2:
            return jsonify({'error': 'At least 2 ingredients required'}), 400
        
        with concurrent.futures.ThreadPoolExecutor() as executor:
            validation_future = executor.submit(recipe_generator.validate_ingredients, ingredients)
            recipes_future = executor.submit(recipe_generator.generate_recipe_options, ingredients)
            
            validation_result = validation_future.result()
            recipes = recipes_future.result()
        
        if not validation_result or not recipes:
            return jsonify({'error': 'Recipe generation failed'}), 400

        with concurrent.futures.ThreadPoolExecutor(max_workers=3) as executor:
            future_to_recipe = {
                executor.submit(recipe_generator.create_recipe_image, recipe['name']): recipe 
                for recipe in recipes
            }
            
            for future in concurrent.futures.as_completed(future_to_recipe):
                recipe = future_to_recipe[future]
                try:
                    image_url = future.result()
                    recipe['imageUrl'] = image_url
                    recipe['validationInfo'] = validation_result
                except Exception as e:
                    recipe['imageUrl'] = None
        
        return jsonify({'recipes': recipes})

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/recipe-details', methods=['POST', 'OPTIONS'])
def get_recipe_details():
    if request.method == "OPTIONS":
        return "", 200

    try:
        data = request.json
        recipe_name = data.get('recipeName')
        ingredients = data.get('ingredients', [])
        
        if not recipe_name:
            return jsonify({'error': 'Recipe name required'}), 400
        
        detailed_recipe = recipe_generator.generate_detailed_recipe(recipe_name, ingredients)
        nutrition_analysis = recipe_generator.get_nutrition_analysis(recipe_name, ingredients)
        
        if not detailed_recipe:
            return jsonify({'error': 'Recipe details generation failed'}), 500
        
        return jsonify({
            'recipe': detailed_recipe,
            'nutritionAnalysis': nutrition_analysis
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/nutrition-info', methods=['POST', 'OPTIONS'])
def get_nutrition_info():
    if request.method == "OPTIONS":
        return "", 200

    try:
        data = request.json
        recipe_name = data.get('recipeName')
        ingredients = data.get('ingredients', [])
        
        nutrition_analysis = recipe_generator.get_nutrition_analysis(recipe_name, ingredients)
        
        if not nutrition_analysis:
            return jsonify({'error': 'Nutrition analysis failed'}), 500
        
        return jsonify({'nutritionInfo': nutrition_analysis})

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/images/<filename>')
def serve_image(filename):
    try:
        url = s3.generate_presigned_url(
            'get_object',
            Params={'Bucket': BUCKET_NAME, 'Key': filename},
            ExpiresIn=3600
        )
        return jsonify({'url': url})
    except Exception as e:
        return jsonify({'error': str(e)}), 404

@app.route('/health')
def health_check():
    try:
        # Verify OpenAI API key
        if not openai.api_key:
            raise Exception("OpenAI API key not configured")
            
        # Verify S3 access
        s3.list_objects_v2(Bucket=BUCKET_NAME, MaxKeys=1)
        
        return jsonify({
            "status": "healthy",
            "openai": "connected",
            "s3": "connected"
        }), 200
    except Exception as e:
        return jsonify({
            "status": "unhealthy",
            "error": str(e)
        }), 500

# Lambda handler
handler = Mangum(app)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 5000)))